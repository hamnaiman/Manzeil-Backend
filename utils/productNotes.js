import {fail,textField} from './contentValidation.js';
export function productScentFields(body){
 const fields={};
 if(body.notes!==undefined){
  let values=body.notes;
  if(typeof values==='string'){if(values.length>600)fail('Notes are too long');values=values.split(/[,\n]/);}
  if(!Array.isArray(values)||values.length>12||values.some(n=>typeof n!=='string'||n.trim().length>40))fail('Add up to 12 notes, each under 40 characters');
  fields.notes=[...new Map(values.map(n=>n.trim()).filter(Boolean).map(n=>[n.toLowerCase(),n])).values()];
 }
 if(body.ingredients!==undefined)fields.ingredients=textField(body.ingredients,'Ingredients',2000);
 return fields;
}
