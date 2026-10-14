import test from 'node:test';import assert from 'node:assert/strict';import {demandFields} from '../utils/scentDemandValidation.js';
test('normalizes only supported anonymous preferences',()=>assert.deepEqual(demandFields({mood:'floral',notes:['Rose','Jasmine','Rose'],email:'private'}),{mood:'floral',notes:['Jasmine','Rose'],intensity:'',occasion:''}));
test('rejects invalid demand values',()=>{for(const b of [{mood:'wrong',notes:[]},{mood:'floral',notes:['bad']},{mood:'fresh',notes:[],intensity:'bad'},{mood:'fresh',notes:[],occasion:'bad'}])assert.throws(()=>demandFields(b));});
