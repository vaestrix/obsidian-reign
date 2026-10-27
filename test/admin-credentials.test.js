import test from 'node:test';
import assert from 'node:assert/strict';
import {adminAuthorized} from '../src/legacy-worker.js';
import {hash} from '../src/portal.js';
const req=(user,password)=>new Request('https://obsidianreign.gg/api/admin/state',{headers:{Authorization:'Basic '+btoa(user+':'+password)}});
test('configured admin ID is required for both encrypted plaintext and digest settings',async()=>{
 const password='test-only-studio-password';
 for(const configured of [password,await hash(password),(await hash(password)).toUpperCase()]){
  const env={ADMIN_USER_ID:'studio-owner',ADMIN_PASSWORD_SHA256:configured};
  assert.equal(await adminAuthorized(req('studio-owner',password),env),true);
  assert.equal(await adminAuthorized(req('admin',password),env),false);
  assert.equal(await adminAuthorized(req('studio-owner','wrong'),env),false);
 }
 assert.equal(await adminAuthorized(req('admin',''),{}),false);
});
