import express from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import {protect} from '../middleware/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';
import {verifiedPurchase} from '../utils/reviewVerification.js';
const router=express.Router();
function bad(message){const e=new Error(message);e.status=400;throw e;}
async function list(admin,productId){
 const filter=admin?{}:{published:true};
 if(productId){if(!mongoose.isValidObjectId(productId))bad("Invalid perfume ID.");filter.product=productId;}
 const rows=await Review.find(filter).sort({createdAt:-1}).limit(100).populate('product','name images image isActive').populate('order','orderStatus orderItems').lean();
 return rows.filter(r=>admin||(r.product && r.product.isActive!==false)).map(r=>({ _id:r._id,name:r.name,body:r.body,rating:r.rating,published:r.published,product:r.product?{_id:r.product._id,name:r.product.name,images:r.product.images?.map(image=>({url:image.url}))}:null,verified:verifiedPurchase(r.order,r.product?._id),...(admin?{orderId:r.order?._id||''}:{}) }));
}
router.get('/',asyncHandler(async(req,res)=>res.json({data:await list(false,req.query.product)})));
router.use(protect);
router.get('/admin',asyncHandler(async(req,res)=>res.json({data:await list(true)})));
async function save(req,res){
 const b=req.body;
 if(typeof b.name!=='string'||!b.name.trim()||b.name.length>80||typeof b.body!=='string'||!b.body.trim()||b.body.length>1000)bad('Enter a customer name and review (maximum 1000 characters).');
 if(!Number.isInteger(Number(b.rating))||Number(b.rating)<1||Number(b.rating)>5)bad('Rating must be 1–5.');
 if(!mongoose.isValidObjectId(b.product)||!await Product.exists({_id:b.product}))bad('Choose an existing perfume.');
 let order;
 if(b.orderId){
  if(!mongoose.isValidObjectId(b.orderId))bad('Invalid order ID.');
  order=await Order.findById(b.orderId);
  if(!verifiedPurchase(order,b.product))bad('Verification requires a delivered order containing this perfume.');
 }
 const fields={name:b.name.trim(),body:b.body.trim(),rating:Number(b.rating),product:b.product,order:order?._id||null,published:b.published===true};
 let row;
 if(req.params.id){if(!mongoose.isValidObjectId(req.params.id))bad('Invalid review ID.');row=await Review.findByIdAndUpdate(req.params.id,fields,{new:true,runValidators:true});if(!row)return res.status(404).json({message:'Review not found'});}
 else row=await Review.create(fields);
 res.json({data:row});
}
router.post('/',asyncHandler(save));router.put('/:id',asyncHandler(save));
router.delete('/:id',asyncHandler(async(req,res)=>{if(!mongoose.isValidObjectId(req.params.id))bad('Invalid review ID.');await Review.findByIdAndDelete(req.params.id);res.json({success:true});}));
export default router;
