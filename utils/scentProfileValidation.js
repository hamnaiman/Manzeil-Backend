import {fail} from './contentValidation.js';
const notes=['Rose','Jasmine','Citrus','Bergamot','Vanilla','Amber','Sandalwood','Musk','Oud','Fruity'];
const occasions=['Everyday','Work','Evening','Special occasion'];
export function scentProfileFields(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>500)fail('Invalid scent profiles');
 const output={};
 for(const [id,row] of Object.entries(value)){
  if(!/^[a-f0-9]{24}$/i.test(id)||!row||typeof row!=='object')fail('Invalid perfume profile');
  if(!Array.isArray(row.notes)||row.notes.length>10||row.notes.some(n=>!notes.includes(n)))fail('Invalid fragrance notes');
  if(!['','light','balanced','rich'].includes(row.intensity))fail('Invalid fragrance intensity');
  if(!Array.isArray(row.occasions)||row.occasions.length>4||row.occasions.some(n=>!occasions.includes(n)))fail('Invalid fragrance occasions');
  output[id]={notes:[...new Set(row.notes)],intensity:row.intensity,occasions:[...new Set(row.occasions)]};
 }
 return {scentProfiles:output};
}
