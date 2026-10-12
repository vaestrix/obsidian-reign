import test from 'node:test';
import assert from 'node:assert/strict';
import {validateApprovalEvidence,authorizesInitialCreativeTask} from '../src/approval-evidence.js';
const at='2026-10-11T12:00:00.000Z';
test('initial production authorization must be owner scope authorization',()=>{
 const owner=validateApprovalEvidence({kind:'owner_scope_authorization',reference:'owner-confirmation-123',approvedAt:at});
 assert.equal(authorizesInitialCreativeTask(owner),true);
 for(const kind of ['customer_written_approval','customer_portal_review']){
  const evidence=validateApprovalEvidence({kind,reference:'customer-review-123',approvedAt:at});
  assert.equal(authorizesInitialCreativeTask(evidence),false);
 }
});
test('approval evidence must have a source reference and valid timestamp',()=>{
 assert.equal(validateApprovalEvidence({kind:'owner_scope_authorization',reference:'ok',approvedAt:at}),null);
 assert.equal(validateApprovalEvidence({kind:'owner_scope_authorization',reference:'owner-confirmation-123',approvedAt:'invalid'}),null);
});
