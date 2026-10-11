import express from 'express';
import multer from 'multer';
import BlogPost from '../models/BlogPost.js';
import Product from '../models/Product.js';
import Story from '../models/Story.js';
import { protect } from '../middleware/authMiddleware.js';
import { cloudinary } from '../config/cloudinary.js';
import asyncHandler from '../utils/asyncHandler.js';
import { fail } from '../utils/contentValidation.js';
import { blogFields, mergePosts, starterPosts } from '../utils/blogContent.js';
const router=express.Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1,fields:12,fieldSize:120000},fileFilter(req,file,cb){cb(['image/jpeg','image/png','image/webp'].includes(file.mimetype)?null:Object.assign(new Error('Use JPG, PNG or WebP'),{status:400}),['image/jpeg','image/png','image/webp'].includes(file.mimetype));}}).single('cover');
const allPosts=async()=>mergePosts(await BlogPost.find().lean());
function publicPost(post, full=false) {
 const {body,cover,story,relatedProduct,__v,_id,...rest}=post;
 return {...rest,cover:{url:cover?.url},...(full?{body}:{}),readingTime:Math.max(1,Math.ceil(body.trim().split(/\s+/).length/200))};
}
router.get('/',asyncHandler(async(req,res)=>{
 const posts=(await allPosts()).filter(p=>p.published);
 res.json({success:true,data:posts.map(p=>publicPost(p))});
}));
router.get('/admin',protect,asyncHandler(async(req,res)=>res.json({success:true,data:await allPosts()})));
router.get('/:slug',asyncHandler(async(req,res)=>{
 const post=(await allPosts()).find(p=>p.slug===req.params.slug && p.published);
 if(!post)fail('Article not found',404);
 const product=post.relatedProduct ? await Product.findOne({_id:post.relatedProduct,isActive:true}).select('name images price discountPrice').lean():null;
 const story=post.story ? await Story.findOne({_id:post.story,published:true}).select('title video.url poster.url').lean():null;
 res.json({success:true,data:{...publicPost(post,true),product,video:story?.video?.url?{url:story.video.url,poster:story.poster?.url,title:story.title}:null}});
}));
router.use(protect);
async function save(req,res) {
 const slug=req.params.slug || req.body.slug;
 if(typeof slug!=='string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length>140)fail('Use a short URL with lowercase letters, numbers and hyphens');
 const fields=blogFields(req.body);
 const starter=starterPosts.find(p=>p.slug===slug);
 let doc=await BlogPost.findOne({slug});
 if(req.method==='POST' && (doc || starter))fail('This article URL already exists');
 if(req.method==='PUT' && !doc && !starter)fail('Article not found',404);
 if(fields.relatedProduct && !await Product.exists({_id:fields.relatedProduct,isActive:true}))fail('Choose an active product');
 if(fields.story && !await Story.exists({_id:fields.story}))fail('Choose an existing video');
 doc ||= new BlogPost(starter || {slug});
 const previous=doc.cover?.publicId;
 Object.assign(doc,fields);
 let asset;
 try {
  if(req.file) {
   asset=await new Promise((resolve,reject)=>cloudinary.uploader.upload_stream({folder:'perfume-store/blog',resource_type:'image',transformation:[{width:1800,crop:'limit'}]},(error,result)=>error?reject(error):resolve({url:result.secure_url,publicId:result.public_id})).end(req.file.buffer));
   doc.cover=asset;
  }
  if(!doc.cover?.url)fail('Add a cover image');
  await doc.save();
 } catch(error) {
  if(asset)await cloudinary.uploader.destroy(asset.publicId).catch(()=>{});
  throw error;
 }
 if(asset && previous)await cloudinary.uploader.destroy(previous).catch(()=>console.warn('Blog cover cleanup failed'));
 res.status(req.method==='POST'?201:200).json({success:true,data:doc});
}
router.post('/',upload,asyncHandler(save));
router.put('/:slug',upload,asyncHandler(save));
export default router;
