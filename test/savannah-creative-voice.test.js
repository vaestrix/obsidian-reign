import test from 'node:test';
import assert from 'node:assert/strict';
import {PERSONA} from '../src/savannah.js';
test('Savannah communicates as a warm creative lead',()=>{
 assert.match(PERSONA,/warm, hands-on creative concierge/);
 assert.match(PERSONA,/founder-led creative studio/);
 assert.match(PERSONA,/genuine curiosity about their creative vision/);
});
test('Savannah does not falsely claim founder or human identity',()=>{
 assert.match(PERSONA,/do not falsely claim to be the actual founder/);
 assert.match(PERSONA,/If asked whether you are AI, answer truthfully/);
});
