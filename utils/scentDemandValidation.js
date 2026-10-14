import {fail} from './contentValidation.js';
const notes=['Rose','Jasmine','Citrus','Bergamot','Vanilla','Amber','Sandalwood','Musk','Oud','Fruity'];
export function demandFields(body){
 if(!['fresh','floral','woody','warm'].includes(body.mood))fail('Invalid fragrance family');
 if(!Array.isArray(body.notes)||body.notes.length>4||body.notes.some(n=>!notes.includes(n)))fail('Invalid fragrance notes');
 if(!['','light','balanced','rich'].includes(body.intensity||''))fail('Invalid fragrance preference');
 if(!['','Everyday','Work','Evening','Special occasion'].includes(body.occasion||''))fail('Invalid occasion');
 return {mood:body.mood,notes:[...new Set(body.notes)].sort(),intensity:body.intensity||'',occasion:body.occasion||''};
}
