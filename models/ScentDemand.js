import mongoose from 'mongoose';
const schema=new mongoose.Schema({signature:{type:String,required:true,unique:true},mood:{type:String,required:true},notes:[String],intensity:String,occasion:String,count:{type:Number,default:0},lastRequestedAt:Date},{timestamps:true});
export default mongoose.model('ScentDemand',schema);
