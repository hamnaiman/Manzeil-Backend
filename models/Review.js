import mongoose from 'mongoose';
const schema=new mongoose.Schema({name:{type:String,required:true,maxLength:80},body:{type:String,required:true,maxLength:1000},rating:{type:Number,required:true,min:1,max:5},product:{type:mongoose.Schema.Types.ObjectId,ref:'Product',required:true},order:{type:mongoose.Schema.Types.ObjectId,ref:'Order'},published:{type:Boolean,default:false}}, {timestamps:true});
export default mongoose.model('Review',schema);
