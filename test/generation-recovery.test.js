import test from 'node:test';
import assert from 'node:assert/strict';
import {nextGenerationAction,safeProviderStatus} from '../src/generation-recovery.js';
test('uncertain submissions are never automatically repeated',()=>{
 assert.equal(nextGenerationAction({status:'submission_uncertain'}),'reconcile_with_provider_do_not_resubmit');
});
test('only approved unsubmitted jobs can proceed to initial submission',()=>{
 assert.equal(nextGenerationAction({status:'approved_not_submitted'}),'submit_once_with_idempotency');
 for(const status of ['pending_owner_approval','rejected','completed','failed'])assert.notEqual(nextGenerationAction({status}),'submit_once_with_idempotency');
});
test('submitted jobs require provider identity to poll',()=>{
 assert.equal(nextGenerationAction({status:'submitted',providerJobId:'job-123'}),'poll_provider_job');
 assert.equal(nextGenerationAction({status:'submitted'}),'manual_review');
});
test('unknown provider statuses fail closed',()=>{
 assert.equal(safeProviderStatus({providerJobId:'job-123',providerStatus:'SOMETHING_ELSE'}),null);
 assert.deepEqual(safeProviderStatus({providerJobId:'job-123',providerStatus:'SUCCEEDED'}),{providerJobId:'job-123',status:'completed'});
});
