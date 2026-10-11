import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import jwt from "jsonwebtoken";
import { Writable } from "node:stream";
import Story from "../models/Story.js";
import SiteContent from "../models/SiteContent.js";
import ContactMessage from "../models/ContactMessage.js";
import Product from "../models/Product.js";
import Admin from "../models/Admin.js";
import { cloudinary } from "../config/cloudinary.js";
import stories from "../routes/storyRoutes.js";
import content from "../routes/contentRoutes.js";
import contact from "../routes/contactRoutes.js";
import products from "../routes/productRoutes.js";
import { errorHandler } from "../middleware/errorMiddleware.js";
import { storyFields, pageNumber, emailField } from "../utils/contentValidation.js";

// No connection to MongoDB or Cloudinary: exercise HTTP routes with model doubles.
const records = [];
const messages = [];
const removed = [];
let currentSettings = null;
let catalogFilter, catalogPage, catalogLimit;
let rejectSave = false;
let server, base, token;
const request = async (path, method = "GET", body, auth = false) => {
  const headers = auth ? { Authorization: "Bearer " + token } : {};
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  const response = await fetch(base + path, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
  return { status: response.status, data: await response.json() };
};
before(async () => {
  process.env.JWT_SECRET = "isolated-test-secret";
  token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);
  Admin.findById = () => ({ select: async () => ({ _id: "507f1f77bcf86cd799439011" }) });
  Story.prototype.save = async function () {
    await this.validate();
    if (rejectSave) throw new Error("Simulated database failure");
    const index = records.findIndex(item => String(item._id) === String(this._id));
    if (index < 0) records.push(this); else records[index] = this;
    return this;
  };
  Story.prototype.deleteOne = async function () { records.splice(records.indexOf(this), 1); };
  Story.findById = async id => records.find(item => String(item._id) === id) || null;
  Story.find = (filter = {}) => ({
    sort: () => {
      const items = records.filter(item => filter.published === undefined || item.published === filter.published).sort((a, b) => a.order - b.order);
      const promise = Promise.resolve(items);
      promise.select = async () => items;
      return promise;
    },
  });
  SiteContent.findOne = async () => currentSettings;
  SiteContent.findOneAndUpdate = async (_, update) => {
    currentSettings = new SiteContent({ ...(currentSettings?.toObject() || {}), ...update.$set });
    await currentSettings.validate();
    return currentSettings;
  };
  ContactMessage.create = async fields => { const doc = new ContactMessage(fields); await doc.validate(); messages.push(doc); return doc; };
  ContactMessage.find = (filter = {}) => ({ sort: () => ({ skip: () => ({ limit: async () => messages.filter(item => !filter.status || item.status === filter.status) }) }) });
  ContactMessage.countDocuments = async () => messages.length;
  ContactMessage.findByIdAndUpdate = async (id, fields) => { const item = messages.find(m => String(m._id) === id); if (item) Object.assign(item, fields); return item; };
  Product.find = filter => {
    catalogFilter = filter;
    return { sort: () => ({ skip: value => { catalogPage = value; return { limit: async limit => { catalogLimit = limit; return [{ _id: "p1", name: "Rose", price: 1200, category: "female" }]; } }; } }) };
  };
  Product.countDocuments = async () => 1;
  cloudinary.uploader.upload_stream = (options, cb) => new Writable({
    write(chunk, encoding, done) { done(); },
    final(done) { cb(null, { secure_url: "https://example.com/film.mp4", public_id: "test/" + options.resource_type }); done(); },
  });
  cloudinary.uploader.destroy = async (id, options) => { removed.push({ id, ...options }); return {}; };
  const app = express();
  app.use(express.json());
  app.use("/stories", stories); app.use("/content", content); app.use("/contact", contact); app.use("/products", products);
  app.use(errorHandler);
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  base = "http://127.0.0.1:" + server.address().port;
});
after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
test("input validation rejects bad booleans, emails and pagination", () => {
  assert.throws(() => storyFields({ published: "no" }));
  assert.throws(() => storyFields({ order: -2 }));
  assert.throws(() => emailField("bad@"));
  assert.equal(emailField("a@example.com"), "a@example.com");
  assert.equal(pageNumber("bad"), 1);
  assert.equal(pageNumber(-5, 12, 50), 12);
  assert.equal(pageNumber(900, 12, 50), 50);
});
test("private story, settings and inbox routes reject anonymous requests", async () => {
  for (const [path, method, body] of [
    ["/stories/admin", "GET"], ["/stories", "POST", { title: "No" }],
    ["/stories/anything", "PUT", {}], ["/stories/anything", "DELETE"],
    ["/content", "PUT", { email: "a@example.com" }], ["/contact", "GET"],
    ["/contact/anything", "PATCH", { status: "read" }],
  ]) assert.equal((await request(path, method, body)).status, 401);
});
test("story drafts are private and publishing updates the public list", async () => {
  const draft = await request("/stories", "POST", { title: "First film", published: false }, true);
  assert.equal(draft.status, 201);
  assert.equal((await request("/stories")).data.data.length, 0);
  assert.equal((await request("/stories/admin", "GET", undefined, true)).data.data.length, 1);
  const updated = await request("/stories/" + draft.data.data._id, "PUT", { published: true, order: 4 }, true);
  assert.equal(updated.status, 200);
  assert.equal((await request("/stories")).data.data[0].title, "First film");
});
test("invalid story fields and unknown IDs return client errors", async () => {
  assert.equal((await request("/stories", "POST", { title: "", published: true }, true)).status, 400);
  assert.equal((await request("/stories/missing", "PUT", { title: "Missing" }, true)).status, 404);
});
test("video upload stores returned URL and deletion cleans the asset", async () => {
  const form = new FormData();
  form.append("title", "Uploaded film"); form.append("published", "true");
  form.append("video", new Blob(["fake-media-for-mocked-uploader"], { type: "video/mp4" }), "film.mp4");
  const result = await request("/stories", "POST", form, true);
  assert.equal(result.status, 201);
  assert.equal(result.data.data.video.url, "https://example.com/film.mp4");
  assert.equal((await request("/stories/" + result.data.data._id, "DELETE", undefined, true)).status, 200);
  assert.ok(removed.some(item => item.id === "test/video" && item.resource_type === "video"));
});
test("upload rejects unsupported media and cleans up after failed database save", async () => {
  const wrong = new FormData(); wrong.append("title", "Bad upload"); wrong.append("video", new Blob(["bad"], { type: "text/plain" }), "bad.txt");
  assert.equal((await request("/stories", "POST", wrong, true)).status, 400);
  rejectSave = true;
  const count = removed.length;
  const form = new FormData(); form.append("title", "Rollback"); form.append("video", new Blob(["test"], { type: "video/mp4" }), "test.mp4");
  try { assert.equal((await request("/stories", "POST", form, true)).status, 500); }
  finally { rejectSave = false; }
  assert.equal(removed.length, count + 1);
});
test("admin settings save and return public contact details", async () => {
  assert.equal((await request("/content")).status, 200);
  const result = await request("/content", "PUT", { email: "care@example.com", storyTitle: "Our story", key: "ignored" }, true);
  assert.equal(result.status, 200);
  assert.equal((await request("/content")).data.data.email, "care@example.com");
  assert.equal(result.data.data.key, "storefront");
  assert.equal((await request("/content", "PUT", { email: "invalid" }, true)).status, 400);
});
test("contact submission validates and appears in the protected inbox", async () => {
  assert.equal((await request("/contact", "POST", { name: "", email: "bad" })).status, 400);
  const result = await request("/contact", "POST", { name: "Test", email: "test@example.com", subject: "Order query", message: "Please help with my order", status: "resolved" });
  assert.equal(result.status, 201);
  assert.equal(result.data.data, undefined);
  const inbox = await request("/contact", "GET", undefined, true);
  assert.equal(inbox.data.data[0].status, "new");
  const updated = await request("/contact/" + inbox.data.data[0]._id, "PATCH", { status: "resolved" }, true);
  assert.equal(updated.data.data.status, "resolved");
  assert.equal((await request("/contact/" + inbox.data.data[0]._id, "PATCH", { status: "invalid" }, true)).status, 400);
});
test("public contact form rate limits repeated submissions", async () => {
  for (let i = 0; i < 3; i++) await request("/contact", "POST", {});
  assert.equal((await request("/contact", "POST", {})).status, 429);
});
test("product API preserves category filtering and bounds malformed pagination", async () => {
  const result = await request("/products?category=female&page=bad&limit=-1&search=%5B");
  assert.equal(result.status, 200);
  assert.equal(result.data.data[0].name, "Rose");
  assert.equal(catalogFilter.category, "female");
  assert.equal(catalogFilter.isActive, true);
  assert.equal(catalogPage, 0);
  assert.equal(catalogLimit, 12);
  assert.equal(catalogFilter.name.$regex, "\\[");
});

test("collection catalog applies price and stock filters through HTTP",async()=>{
 const result=await request("/products?category=male&minPrice=0&maxPrice=5000&inStock=true&page=2");
 assert.equal(result.status,200);
 assert.equal(catalogFilter.category,"male");
 assert.deepEqual(catalogFilter.price,{$gte:0,$lte:5000});
 assert.deepEqual(catalogFilter.stock,{$gt:0});
 assert.equal(catalogPage,12);
 assert.equal((await request("/products?minPrice=bad")).status,400);
});
test("collection content rejects unauthenticated and malformed changes",async()=>{
 assert.equal((await request("/content","PUT",{collectionHeroes:{"for-her":{title:"New",intro:"New intro"}}})).status,401);
 assert.equal((await request("/content","PUT",{collectionHeroes:{"wrong":{title:"New",intro:"New intro"}}},true)).status,400);
 assert.equal((await request("/content/media/for-herHero","PUT")).status,401);
 assert.equal((await request("/content/media/wrongHero","PUT",undefined,true)).status,400);
});
