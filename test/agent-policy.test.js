import test from 'node:test';
import assert from 'node:assert/strict';
import {AGENTS,authorizeAgentMessage,assertAgentMessage} from '../src/agent-policy.js';

test('all eight agent roles are defined',()=>assert.equal(Object.keys(AGENTS).length,8));
test('Vesper may speak only to Savannah and owner internally',()=>{
  for(const to of ['savannah','owner']) assert.equal(authorizeAgentMessage({from:'vesper',to,channel:'internal'}),true);
  for(const to of ['customer','anna','atlas','forge','mercury','sentinel','nova']) assert.equal(authorizeAgentMessage({from:'vesper',to,channel:'internal'}),false);
  for(const channel of ['customer','email','public','webhook']) assert.equal(authorizeAgentMessage({from:'vesper',to:'savannah',channel}),false);
});
test('only Savannah and owner can address Vesper',()=>{
  assert.equal(authorizeAgentMessage({from:'savannah',to:'vesper',channel:'internal'}),true);
  for(const from of ['anna','atlas','forge','mercury','sentinel','nova']) assert.equal(authorizeAgentMessage({from,to:'vesper',channel:'internal'}),false);
});
test('customer-facing permissions are narrow',()=>{
  assert.equal(authorizeAgentMessage({from:'anna',to:'customer',channel:'customer'}),true);
  assert.equal(authorizeAgentMessage({from:'savannah',to:'customer',channel:'customer'}),true);
  for(const from of ['vesper','atlas','forge','mercury','sentinel','nova']) assert.equal(authorizeAgentMessage({from,to:'customer',channel:'customer'}),false);
});
test('unknown actors, channels and recipients fail closed',()=>{
  for(const m of [{from:'fake',to:'owner',channel:'internal'},{from:'vesper',to:'customer',channel:'customer'},{from:'savannah',to:'vesper',channel:'email'},{from:'anna',to:'vesper',channel:'internal'}]) assert.throws(()=>assertAgentMessage(m));
});
