import test from 'node:test';import assert from 'node:assert/strict';import {feedbackFields} from '../utils/contactFeedback.js';
test('legacy messages remain ordinary messages',()=>assert.deepEqual(feedbackFields({}),{kind:'message'}));
test('feedback accepts only integer stars 1 through 5',()=>{for(const rating of [1,2,3,4,5])assert.deepEqual(feedbackFields({kind:'feedback',rating}),{kind:'feedback',rating});for(const rating of [undefined,0,6,2.5,'5',null])assert.throws(()=>feedbackFields({kind:'feedback',rating}));});
test('invalid kind rejected and ordinary messages do not retain ratings',()=>{assert.throws(()=>feedbackFields({kind:'other'}));assert.deepEqual(feedbackFields({kind:'message',rating:5}),{kind:'message'});});
