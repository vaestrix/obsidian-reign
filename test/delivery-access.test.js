import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizeCustomerDelivery} from '../src/delivery-access.js';
const now=Date.parse('2026-10-11T12:00:00Z');
const base={project:{id:'p1',owner:'google:alice',reviews:[{id:'v2',status:'approved',decidedAt:'2026-10-11T11:30:00Z'}]},owner:'google:alice',versionId:'v2',authorization:{status:'authorized_not_delivered'},manifest:{projectId:'p1',versionId:'v2'},verification:{projectId:'p1',versionId:'v2',verifiedAt:'2026-10-11T11:59:00Z'},now};
test('approved owner can access current verified version',()=>assert.equal(authorizeCustomerDelivery(base).allowed,true));
test('different customer is denied',()=>assert.equal(authorizeCustomerDelivery({...base,owner:'google:bob'}).reason,'access_denied'));
test('older preview approval is denied',()=>assert.equal(authorizeCustomerDelivery({...base,versionId:'v1'}).reason,'current_approval_required'));
test('missing owner authorization is denied',()=>assert.equal(authorizeCustomerDelivery({...base,authorization:null}).reason,'owner_authorization_required'));
test('stale or future verification is denied',()=>{
 assert.equal(authorizeCustomerDelivery({...base,verification:{...base.verification,verifiedAt:'2026-10-11T11:00:00Z'}}).reason,'fresh_verification_required');
 assert.equal(authorizeCustomerDelivery({...base,verification:{...base.verification,verifiedAt:'2026-10-11T12:01:00Z'}}).reason,'fresh_verification_required');
});
