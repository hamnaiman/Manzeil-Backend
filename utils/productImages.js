export function retainedImages(current, raw) {
  if (raw === undefined) return [...current];
  let ids;
  try { ids = JSON.parse(raw); } catch { throw Object.assign(new Error("Invalid image selection"), {status:400}); }
  if (!Array.isArray(ids) || ids.length > 20 || new Set(ids).size !== ids.length || ids.some(id => typeof id !== "string" || !current.some(image => image.publicId === id))) throw Object.assign(new Error("Invalid image selection"), {status:400});
  return ids.map(id => current.find(image => image.publicId === id));
}
