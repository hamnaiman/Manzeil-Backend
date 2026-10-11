import { fail, textField } from './contentValidation.js';
export const blogCategories = ['Scent Guide', 'Notes & Ingredients', 'Everyday Rituals', 'Behind Manzeil'];
export const starterPosts = [
  { slug:'find-your-signature-scent', title:'Find your signature scent', excerpt:'The notes you love. The mood you return to. A little guide to finding a fragrance that feels like you.', category:'Scent Guide', notes:['Fresh','Floral','Woody'], cover:{url:'/images/posts/obsession.png'}, featured:true, published:true,
    body:'A signature scent does not have to follow a trend. It can be the fragrance you reach for before an ordinary morning, a special dinner, or a quiet day of your own. Begin with what you enjoy, then give yourself time to explore.\n\n## Start with a feeling\nThink about the atmosphere you want to carry with you. Fresh compositions can feel bright and easygoing, florals can feel soft or expressive, and woody fragrances can suggest warmth and depth. These are starting points, not rules about who should wear them.\n\n## Give each fragrance a little time\nTry one fragrance at a time and notice how your impression changes as it settles. The first spray is only one part of the experience. You may enjoy the quieter impression that remains even more than the opening.\n\n## Make room for more than one favourite\nYour everyday scent and your evening favourite can be different. Choose what suits your mood, rather than looking for a single perfect answer. A small collection can reflect the many sides of you.\n\n## Follow your own taste\nExplore the Manzeil collection, take your time, and keep coming back to the scent you enjoy wearing. The best signature is one you choose for yourself.' },
  { slug:'from-daylight-to-date-night', title:'From daylight to date night', excerpt:'Small rituals, changing moods. Make fragrance part of the moments that matter to you.', category:'Everyday Rituals', notes:['Warm','Woody'], cover:{url:'/images/posts/business-elegance.png'}, featured:false, published:true,
    body:'Some days begin slowly and end somewhere unexpected. Your fragrance can be a small part of getting ready, a familiar detail that helps a moment feel your own.\n\n## An easy morning ritual\nChoose something you enjoy wearing through the everyday. Keep your surroundings in mind, especially in shared spaces where other people may prefer a lighter scent. A thoughtful amount is often all you need.\n\n## A moment to reset\nBefore heading out, take a pause. Change your shirt, choose an accessory, or revisit the scent you started the day with. You do not need a whole new routine to mark the transition.\n\n## For the evening ahead\nIf you enjoy warm or woody fragrances, an evening can be a lovely time to explore them. There is no fixed day-versus-night rule: your own taste matters more than the clock.\n\n## Keep it personal\nWear fragrance for the feeling it gives you. Whether the plan is a dinner, a celebration, or a favourite place with a favourite person, choose a scent that feels comfortable and entirely yours.' },
  { slug:'inside-serene', title:'Inside Serene: a softer kind of statement', excerpt:'A floral mood, a quiet moment, and the beauty of making an everyday ritual your own.', category:'Notes & Ingredients', notes:['Floral','Soft'], cover:{url:'/images/posts/serene.png'}, featured:false, published:true,
    body:'Softness can make an impression of its own. The world around Serene is inspired by a floral mood: open petals, gentle colour, and a moment of calm in a busy day.\n\n## A floral point of view\nFloral fragrances can be light, rich, delicate, or expressive. Rather than treating floral as a single style, think of it as a starting point for discovering which impressions you enjoy.\n\n## The beauty of a small ritual\nA favourite fragrance can become part of the way you get ready. Take a moment, choose what feels right, and let the ritual be simple. It does not have to be reserved for a special occasion.\n\n## Find your own impression\nEvery person brings different memories and associations to a scent. Explore Serene with an open mind and notice what it reminds you of. Your interpretation is part of the experience.\n\n## Explore Serene\nDiscover the product page for current details and availability. The flowers in our campaign express its visual mood; refer to the product description for the fragrance information.' }
];
export function mergePosts(saved) {
  const posts = new Map(starterPosts.map(post => [post.slug, {...post}]));
  for (const post of saved) posts.set(post.slug, post);
  return [...posts.values()].sort((a,b) => Number(b.featured)-Number(a.featured) || new Date(b.updatedAt || 0)-new Date(a.updatedAt || 0));
}
export function blogFields(body) {
  const result = {};
  for (const [key,max] of [['title',120],['excerpt',320],['body',30000]]) result[key] = textField(body[key],key,max,true);
  if (!blogCategories.includes(body.category)) fail('Choose a valid category');
  result.category=body.category;
  for(const key of ['published','featured']) {
    if(![true,false,'true','false'].includes(body[key])) fail('Invalid '+key+' value');
    result[key]=body[key]===true || body[key]==='true';
  }
  const notes=textField(body.notes ?? '', 'Notes', 160);
  result.notes=notes.split(',').map(x=>x.trim()).filter(Boolean);
  if(result.notes.length>5 || result.notes.some(x=>x.length>30)) fail('Use up to five notes, each under 30 characters');
  for(const key of ['relatedProduct','story']) {
    const value=body[key] || '';
    if(typeof value!=='string' || (value && !/^[a-f0-9]{24}$/i.test(value))) fail('Invalid '+key);
    result[key]=value || null;
  }
  return result;
}
