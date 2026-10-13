export function feedbackFields(body){
 const kind=body.kind||'message';
 if(!['message','feedback'].includes(kind)){const e=new Error('Invalid message type');e.status=400;throw e;}
 if(kind==='message')return {kind};
 if(!Number.isInteger(body.rating)||body.rating<1||body.rating>5){const e=new Error('Please choose a rating from 1 to 5.');e.status=400;throw e;}
 return {kind,rating:body.rating};
}
