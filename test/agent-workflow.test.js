import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizeOrderTransition,assertOrderTransition} from '../src/agent-workflow.js';
import {authorizeAgentMessage} from '../src/agent-policy.js';

test('Anna hands qualified leads to Savannah, not Vesper',()=>{
 assert.equal(authorizeOrderTransition({from:'qualified',to:'handed_to_savannah',actor:'anna'}),true);
 assert.equal(authorizeOrderTransition({from:'qualified',to:'production_queued',actor:'anna'}),false);
});
test('Savannah controls customer-facing production steps',()=>{
 assert.equal(authorizeOrderTransition({from:'preview_ready',to:'customer_review',actor:'savannah'}),true);
 assert.equal(authorizeOrderTransition({from:'quality_verified',to:'delivered',actor:'vesper'}),false);
 assert.equal(authorizeOrderTransition({from:'quality_verified',to:'delivered',actor:'savannah'}),true);
});
test('approvals require evidence',()=>{
 assert.equal(authorizeOrderTransition({from:'customer_review',to:'approved',actor:'savannah'}),false);
 assert.equal(authorizeOrderTransition({from:'customer_review',to:'approved',actor:'savannah',approvalEvidence:'customer-approved-123'}),true);
 assert.throws(()=>assertOrderTransition({from:'customer_review',to:'approved',actor:'vesper',approvalEvidence:'customer-approved-123'}));
});
test('Vesper can produce but cannot authorize delivery',()=>{
 assert.equal(authorizeOrderTransition({from:'production_queued',to:'preview_ready',actor:'vesper'}),true);
 assert.equal(authorizeOrderTransition({from:'approved',to:'quality_verified',actor:'vesper'}),true);
 assert.equal(authorizeOrderTransition({from:'approved',to:'delivered',actor:'vesper'}),false);
});
test('owner can message Vesper but not via customer channel',()=>{
 assert.equal(authorizeAgentMessage({from:'owner',to:'vesper',channel:'internal'}),true);
 assert.equal(authorizeAgentMessage({from:'owner',to:'vesper',channel:'customer'}),false);
});
