import { fail, textField } from "./contentValidation.js";
export const collectionKeys = ["all","for-her","for-him","unisex"];
export function collectionFields(value) {
 if (!value || typeof value !== "object" || Array.isArray(value)) fail("Invalid collection settings");
 const fields={};
 for(const [key,hero] of Object.entries(value)){
  if(!collectionKeys.includes(key)||!hero||typeof hero!=="object"||Array.isArray(hero))fail("Invalid collection");
  fields["collectionHeroes."+key]={title:textField(hero.title,"Collection title",100,true),intro:textField(hero.intro,"Collection introduction",500,true)};
 }
 return fields;
}
export function catalogFilters(query) {
 const extra={};
 for(const key of ["minPrice","maxPrice"])if(query[key]!==undefined&&query[key]!==""){
  const value=Number(query[key]);
  if(!Number.isFinite(value)||value<0)fail("Prices must be positive numbers");
  (extra.price??={})[key==="minPrice"?"$gte":"$lte"]=value;
 }
 if(extra.price?.$gte!==undefined&&extra.price?.$lte!==undefined&&extra.price.$gte>extra.price.$lte)fail("Minimum price must not exceed maximum price");
 if(query.inStock==="true")extra.stock={$gt:0};
 return extra;
}
