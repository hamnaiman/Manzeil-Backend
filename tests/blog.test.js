import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import BlogPost from '../models/BlogPost.js';
import Admin from '../models/Admin.js';
import router from '../routes/blogRoutes.js';
import {errorHandler} from '../middleware/errorMiddleware.js';
import {blogFields,mergePosts,starterPosts} from '../utils/blogContent.js';
let server,base,token;const records=[];
before(async()=>{
 process.env.JWT_SECRET='blog-test-only';token=jwt.sign({id:'507f1f77bcf86cd799439011'},process.env.JWT_SECRET);
 Admin.findById=()=>({select:async()=>({_id:'507f1f77bcf86cd799439011'})});
 BlogPost.find=()=>({lean:async()=>records.map(p=>p.toObject())});
 BlogPost.findOne=async({slug})=>records.find(p=>p.slug===slug)||null;
 BlogPost.prototype.save=async function(){await this.validate();const i=records.findIndex(p=>p.slug===this.slug);if(i<0)records.push(this);else records[i]=this;return this;};
 const app=express();app.use(express.json());app.use('/blog',router);app.use(errorHandler);
 await new Promise(resolve=>{server=app.listen(0,'127.0.0.1',resolve);});base='http://127.0.0.1:'+server.address().port;
});
after(()=>new Promise(resolve=>server.close(resolve)));
async function request(url,method='GET',body,auth=false){const r=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()};}
const fields=()=>({...starterPosts[0],notes:'Fresh, Woody',story:'',relatedProduct:''});
test('Validation rejects invalid categories, statuses and relation identifiers',()=>{
 for(const bad of [{category:'bad'},{published:'yes'},{relatedProduct:'not-an-id'},{notes:'x'.repeat(31)},{body:''}])assert.throws(()=>blogFields({...fields(),...bad}));
 assert.equal(blogFields({...fields(),published:'false'}).published,false);
});
test('Stored draft overrides starter instead of restoring it',()=>{
 const posts=mergePosts([{...starterPosts[0],published:false}]);assert.equal(posts.length,3);assert.equal(posts.find(p=>p.slug===starterPosts[0].slug).published,false);
});
test('Public list provides starter articles without body or storage IDs',async()=>{
 const r=await request('/blog');assert.equal(r.status,200);assert.equal(r.body.data.length,3);assert.equal(r.body.data[0].body,undefined);assert.ok(r.body.data[0].readingTime>=1);
});
test('Admin listing and writes require authentication',async()=>{
 assert.equal((await request('/blog/admin')).status,401);
 assert.equal((await request('/blog/'+starterPosts[0].slug,'PUT',fields())).status,401);
});
test('Admin can save, hide and republish a starter without losing siblings',async()=>{
 const slug=starterPosts[0].slug;
 assert.equal((await request('/blog/'+slug,'PUT',{...fields(),published:false},true)).status,200);
 assert.equal((await request('/blog/'+slug)).status,404);
 assert.equal((await request('/blog')).body.data.length,2);
 assert.equal((await request('/blog/admin','GET',null,true)).body.data.length,3);
 assert.equal((await request('/blog/'+slug,'PUT',{...fields(),title:'Updated signature guide'},true)).status,200);
 assert.equal((await request('/blog/'+slug)).body.data.title,'Updated signature guide');
});
test('Missing covers and duplicate URLs are rejected',async()=>{
 assert.equal((await request('/blog','POST',{...fields(),slug:'new-article'},true)).status,400);
 assert.equal((await request('/blog','POST',fields(),true)).status,400);
 assert.equal((await request('/blog/missing','PUT',fields(),true)).status,404);
});
