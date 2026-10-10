import test from "node:test";
import assert from "node:assert/strict";
import { retainedImages } from "../utils/productImages.js";
const images = [{publicId:"a",url:"https://example.com/a"},{publicId:"b",url:"https://example.com/b"}];
test("legacy edits preserve current gallery",()=>assert.deepEqual(retainedImages(images,undefined),images));
test("cover selection preserves requested order",()=>assert.deepEqual(retainedImages(images,'["b","a"]'),[images[1],images[0]]));
test("removed gallery images are omitted",()=>assert.deepEqual(retainedImages(images,'["b"]'),[images[1]]));
test("foreign image IDs and duplicate selections are rejected",()=>{
 for(const raw of ['["foreign"]','["a","a"]','{}','broken','[null]']) assert.throws(()=>retainedImages(images,raw),{status:400});
});
