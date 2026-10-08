export function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}
export function textField(value, name, max, required = false) {
  if (typeof value !== "string") fail(name + " must be text");
  const result = value.trim();
  if ((required && !result) || result.length > max) fail(name + " is required and must be within " + max + " characters");
  return result;
}
export function emailField(value, required = false) {
  const email = textField(value, "Email", 254, required);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Enter a valid email address");
  return email;
}
export function storyFields(body) {
  const fields = {};
  if (body.title !== undefined) fields.title = textField(body.title, "Title", 100, true);
  if (body.note !== undefined) fields.note = textField(body.note, "Description", 240);
  if (body.tone !== undefined) {
    if (!["rose", "noir", "amber", "lavender"].includes(body.tone)) fail("Invalid cover style");
    fields.tone = body.tone;
  }
  if (body.order !== undefined) {
    const order = Number(body.order);
    if (!Number.isInteger(order) || order < 0 || order > 999) fail("Order must be an integer from 0 to 999");
    fields.order = order;
  }
  if (body.published !== undefined) {
    if (![true, false, "true", "false"].includes(body.published)) fail("Invalid publication status");
    fields.published = body.published === true || body.published === "true";
  }
  return fields;
}
export function pageNumber(value, fallback = 1, max = 100000) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? Math.min(number, max) : fallback;
}
