import test from 'node:test';
import assert from 'node:assert/strict';
import {validateProductionMethod,authorizeProductionMethod} from '../src/production-method.js';
test('hand-drawn and hybrid work require confirmed availability',()=>{
 assert.equal(validateProductionMethod({method:'hand_drawn',customerAcknowledged:true}),null);
 assert.equal(validateProductionMethod({method:'hybrid',customerAcknowledged:true}),null);
 assert.ok(validateProductionMethod({method:'hand_drawn',handcraftedConfirmed:true,customerAcknowledged:true}));
});
test('production method requires customer acknowledgment',()=>{
 const method=validateProductionMethod({method:'ai_assisted'});
 assert.equal(authorizeProductionMethod(method).allowed,false);
 assert.equal(authorizeProductionMethod({...method,customerAcknowledged:true}).allowed,true);
});
test('undecided production method cannot enter fulfillment',()=>{
 const method=validateProductionMethod({method:'undecided',customerAcknowledged:true});
 assert.equal(authorizeProductionMethod(method).allowed,false);
});
