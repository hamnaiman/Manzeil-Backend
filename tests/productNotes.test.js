import test from 'node:test';import assert from 'node:assert/strict';import {productScentFields} from '../utils/productNotes.js';
test('old clients leave notes unchanged',()=>assert.deepEqual(productScentFields({}),{}));
test('comma notes normalize and duplicate names collapse',()=>assert.deepEqual(productScentFields({notes:'Rose, Jasmine, rose',ingredients:' Label list '}),{notes:['rose','Jasmine'],ingredients:'Label list'}));
test('notes can be cleared and invalid values rejected',()=>{assert.deepEqual(productScentFields({notes:''}),{notes:[]});assert.throws(()=>productScentFields({notes:{bad:true}}));assert.throws(()=>productScentFields({ingredients:'x'.repeat(2001)}));});
