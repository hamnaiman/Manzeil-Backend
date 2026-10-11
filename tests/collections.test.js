import test from "node:test";
import assert from "node:assert/strict";
import {collectionFields,catalogFilters} from "../utils/collectionValidation.js";
import SiteContent from "../models/SiteContent.js";
test("collection edits are restricted to supported pages and preserve dotted update paths",()=>{
 assert.deepEqual(collectionFields({"for-her":{title:" For her ",intro:" Personal fragrance "}}),{"collectionHeroes.for-her":{title:"For her",intro:"Personal fragrance"}});
 for(const value of [null,[],{"unknown":{title:"x",intro:"y"}},{"for-her":{title:"",intro:"x"}},{"all":{title:"x".repeat(101),intro:"y"}}])assert.throws(()=>collectionFields(value),{status:400});
});
test("saved collection maps serialize for storefront consumption",async()=>{
 const doc=new SiteContent({collectionHeroes:{"for-him":{title:"His signature",intro:"New collection"}},media:{"for-himHero":"https://example.com/hero.jpg"}});
 await doc.validate();
 const data=JSON.parse(JSON.stringify(doc));
 assert.equal(data.collectionHeroes["for-him"].title,"His signature");
 assert.equal(data.media["for-himHero"],"https://example.com/hero.jpg");
});
test("catalog supports zero prices and availability together",()=>{
 assert.deepEqual(catalogFilters({minPrice:"0",maxPrice:"2000",inStock:"true"}),{price:{$gte:0,$lte:2000},stock:{$gt:0}});
 assert.deepEqual(catalogFilters({minPrice:"",maxPrice:"",inStock:"false"}),{});
});
test("invalid price ranges are rejected before reaching MongoDB",()=>{
 for(const query of [{minPrice:"-1"},{maxPrice:"abc"},{maxPrice:"Infinity"},{minPrice:"200",maxPrice:"100"}])assert.throws(()=>catalogFilters(query),{status:400});
});
