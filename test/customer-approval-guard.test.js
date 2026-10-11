import test from 'node:test';
import assert from 'node:assert/strict';
import {currentCustomerApproval} from '../src/customer-approval-guard.js';
const project={id:'p1',reviews:[{id:'new',status:'pending'},{id:'old',status:'approved',decidedAt:'2026-10-10T00:00:00Z'}]};
test('older approval does not authorize latest unapproved revision',()=>{
 assert.equal(currentCustomerApproval(project,'old'),null);
 assert.equal(currentCustomerApproval(project,'new'),null);
});
test('current approved version is accepted',()=>{
 const approved={...project,reviews:[{id:'new',status:'approved',decidedAt:'2026-10-11T00:00:00Z'},...project.reviews.slice(1)]};
 assert.equal(currentCustomerApproval(approved,'new').versionId,'new');
});
test('wrong project or missing timestamp fails closed',()=>{
 assert.equal(currentCustomerApproval({id:'p1',reviews:[{id:'new',status:'approved'}]},'new'),null);
 assert.equal(currentCustomerApproval(null,'new'),null);
});
