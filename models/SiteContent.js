import mongoose from "mongoose";
const schema = new mongoose.Schema({
  scentTestMode:{type:Boolean,default:false},
  scentTestProfiles:{type:Map,of:new mongoose.Schema({notes:[String],intensity:String,occasions:[String]},{_id:false}),default:{}},
  scentProfiles:{type:Map,of:new mongoose.Schema({notes:[String],intensity:{type:String,enum:['','light','balanced','rich'],default:''},occasions:[String]},{_id:false}),default:{}},
  scentVisualizer: {type:Map,of:new mongoose.Schema({title:{type:String,maxlength:100},description:{type:String,maxlength:400},notes:{type:String,maxlength:180},productId:{type:String,maxlength:24},productIds:{type:[String],default:undefined},bottle:{type:String,enum:['obsession','serene','business-elegance']}},{_id:false}),default:{}},
  collectionHeroes: { type: Map, of: new mongoose.Schema({title:{type:String,maxlength:100},intro:{type:String,maxlength:500}},{_id:false}), default:{} },
  media: { type: Map, of: String, default: {} },
  key: { type: String, default: "storefront", unique: true },
  storyTitle: { type: String, maxlength: 140, default: "Some memories begin with a scent." },
  storyText: { type: String, maxlength: 3000, default: "A familiar place. A favourite person. A moment you wish would last. Fragrance is a beautiful way to carry a little of what you love, wherever you go." },
  contactTitle: { type: String, maxlength: 140, default: "We would love to hear from you." },
  contactIntro: { type: String, maxlength: 1000, default: "Have a question about a fragrance or your order? Send us a message." },
  email: { type: String, maxlength: 254, default: "" },
  phone: { type: String, maxlength: 60, default: "" },
  address: { type: String, maxlength: 500, default: "" },
  hours: { type: String, maxlength: 200, default: "" },
}, { timestamps: true });
export default mongoose.model("SiteContent", schema);
