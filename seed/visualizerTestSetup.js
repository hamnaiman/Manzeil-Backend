import 'dotenv/config';
import fs from 'node:fs';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import SiteContent from '../models/SiteContent.js';
try{
 await mongoose.connect(process.env.MONGO_URI,{serverSelectionTimeoutMS:15000});
 const products=await Product.find({isActive:true}).select('name').lean();
 const current=await SiteContent.findOne({key:'storefront'}).lean();
 const backup=new URL('./visualizer-backup-'+Date.now()+'.json',import.meta.url);
 fs.writeFileSync(backup,JSON.stringify({scentTestMode:current?.scentTestMode||false,scentTestProfiles:current?.scentTestProfiles||{},scentVisualizer:current?.scentVisualizer||{}},null,2));
 const profiles={obsession:{notes:['Citrus','Fruity','Amber'],intensity:'balanced',occasions:['Evening','Special occasion']},serene:{notes:['Rose','Jasmine','Musk'],intensity:'light',occasions:['Everyday','Work']},businesselegant:{notes:['Sandalwood','Musk','Amber'],intensity:'rich',occasions:['Work','Evening']},demure:{notes:['Citrus','Bergamot','Musk'],intensity:'light',occasions:['Everyday','Work']},rednotice:{notes:['Rose','Vanilla','Fruity'],intensity:'balanced',occasions:['Evening','Special occasion']},bold:{notes:['Oud','Amber','Musk'],intensity:'rich',occasions:['Evening','Special occasion']}};
 const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
 const data=Object.fromEntries(products.filter(p=>profiles[norm(p.name)]).map(p=>[p._id.toString(),profiles[norm(p.name)]]));
 const families={fresh:['obsession','demure'],floral:['serene','rednotice'],woody:['businesselegant','demure','bold'],warm:['obsession','businesselegant','rednotice','bold']};
 const update={scentTestMode:true,scentTestProfiles:data};
 for(const [family,names] of Object.entries(families))update['scentVisualizer.'+family+'.productIds']=products.filter(p=>names.includes(norm(p.name))).map(p=>p._id.toString());
 await SiteContent.findOneAndUpdate({key:'storefront'},{$set:update},{upsert:true,runValidators:true,setDefaultsOnInsert:true});
 console.log(JSON.stringify({sampleProfiles:Object.keys(data).length,mode:'TEST ONLY',backup:backup.pathname,perfumes:products.filter(p=>data[p._id.toString()]).map(p=>p.name)}));
}finally{await mongoose.disconnect();}
