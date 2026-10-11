import test from 'node:test';
import assert from 'node:assert/strict';
import {authenticateAgent,validateAgentEnvelope} from '../src/agent-auth.js';
const secret='A'.repeat(48);
const env={AGENT_TOKEN_SAVANNAH:secret,AGENT_TOKEN_VESPER:'B'.repeat(48)};
const request=(agent,token)=>new Request('https://internal/api/portal/internal/agent-message',{method:'POST',headers:{'X-Obsidian-Agent':agent,Authorization:'Bearer '+token}});
test('identity is derived from a scoped token, not message body',async()=>{
 assert.equal(await authenticateAgent(request('savannah',secret),env),'savannah');
 assert.equal(await authenticateAgent(request('vesper',secret),env),null);
 assert.equal(await authenticateAgent(request('savannah','Z'.repeat(48)),env),null);
 assert.equal(await authenticateAgent(request('anna',secret),env),null);
});
test('Vesper can only address Savannah or owner',()=>{
 assert.ok(validateAgentEnvelope('vesper',{projectId:'test1',to:'savannah',message:'Preview ready'}));
 assert.ok(validateAgentEnvelope('vesper',{projectId:'test1',to:'owner',message:'Need review'}));
 assert.equal(validateAgentEnvelope('vesper',{projectId:'test1',to:'customer',message:'Hello'}),null);
 assert.equal(validateAgentEnvelope('atlas',{projectId:'test1',to:'vesper',message:'Hello'}),null);
});
test('message actor is never taken from untrusted body',()=>{
 const m=validateAgentEnvelope('savannah',{projectId:'p1',from:'owner',to:'vesper',message:'Create a draft'});
 assert.equal(m.from,'savannah');
});
