import express from 'express';
import ScentDemand from '../models/ScentDemand.js';
import {protect} from '../middleware/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';
import {demandFields} from '../utils/scentDemandValidation.js';
import {pageNumber} from '../utils/contentValidation.js';
const router=express.Router(),attempts=new Map();
router.post('/',(req,res,next)=>{
 const now=Date.now();for(const [key,value] of attempts)if(value.until<now)attempts.delete(key);
 const key=req.ip,entry=attempts.get(key)||{count:0,until:now+10*60*1000};
 if(entry.count>=20||(!attempts.has(key)&&attempts.size>=10000))return res.status(429).json({message:'Please try again later.'});
 entry.count++;attempts.set(key,entry);next();
},asyncHandler(async(req,res)=>{
 const fields=demandFields(req.body),signature=JSON.stringify(fields);
 const update={$setOnInsert:fields,$inc:{count:1},$set:{lastRequestedAt:new Date()}};
 try{await ScentDemand.updateOne({signature},update,{upsert:true,runValidators:true});}
 catch(e){if(e.code!==11000)throw e;await ScentDemand.updateOne({signature},{$inc:{count:1},$set:{lastRequestedAt:new Date()}});}
 res.status(201).json({success:true});
}));
router.get('/',protect,asyncHandler(async(req,res)=>{
 const page=pageNumber(req.query.page),limit=20;
 const [data,total]=await Promise.all([ScentDemand.find().select('-signature').sort({count:-1,lastRequestedAt:-1}).skip((page-1)*limit).limit(limit),ScentDemand.countDocuments()]);
 res.json({data,pagination:{page,pages:Math.ceil(total/limit),total}});
}));
export default router;
