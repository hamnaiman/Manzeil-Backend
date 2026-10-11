import mongoose from 'mongoose';
import { blogCategories } from '../utils/blogContent.js';
const schema = new mongoose.Schema({
 slug:{type:String,required:true,unique:true},
 title:{type:String,required:true,maxlength:120},
 excerpt:{type:String,required:true,maxlength:320},
 body:{type:String,required:true,maxlength:30000},
 category:{type:String,enum:blogCategories,required:true},
 notes:[String],
 cover:{url:String,publicId:String},
 published:{type:Boolean,default:false}, featured:{type:Boolean,default:false},
 relatedProduct:{type:mongoose.Schema.Types.ObjectId,ref:'Product',default:null},
 story:{type:mongoose.Schema.Types.ObjectId,ref:'Story',default:null},
},{timestamps:true});
export default mongoose.model('BlogPost',schema);
