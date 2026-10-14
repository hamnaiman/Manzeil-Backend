import {textField,fail} from './contentValidation.js';
export const moodKeys=['fresh','floral','woody','warm'];
export function visualizerFields(value){
 if(!value||typeof value!=='object'||Array.isArray(value))fail('Invalid scent visualizer settings');
 const output={};
 for(const [key,item] of Object.entries(value)){
  if(!moodKeys.includes(key)||!item||typeof item!=='object'||Array.isArray(item))fail('Invalid fragrance mood');
  const row={};
  for(const [field,max] of Object.entries({title:100,description:400,notes:180,productId:24}))if(item[field]!==undefined)row[field]=textField(item[field],field,max);
  if(row.productId&&!/^[a-f0-9]{24}$/i.test(row.productId))fail('Invalid perfume ID');
  if(item.productIds!==undefined){
   if(!Array.isArray(item.productIds)||item.productIds.length>12||item.productIds.some(id=>typeof id!=='string'||!/^[a-f0-9]{24}$/i.test(id)))fail('Choose up to 12 valid perfumes per mood');
   row.productIds=[...new Set(item.productIds)];
  }
  if(item.bottle!==undefined){if(!['obsession','serene','business-elegance'].includes(item.bottle))fail('Choose a bottle');row.bottle=item.bottle;}
  output[key]=row;
 }
 return {scentVisualizer:output};
}
