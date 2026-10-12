import test from 'node:test';
import assert from 'node:assert/strict';
import {PERSONA} from '../src/savannah.js';
test('Savannah explains reference assets and scratch creation',()=>{
 assert.match(PERSONA,/customer-supplied pictures/);
 assert.match(PERSONA,/developed from scratch/);
});
test('Savannah gives qualified 2 to 4 day digital preview estimate',()=>{
 assert.match(PERSONA,/2 to 4 days/);
 assert.match(PERSONA,/estimate, not a guaranteed deadline/);
 assert.match(PERSONA,/customer approval/);
});
test('Savannah avoids misleading production claims and answers direct AI questions truthfully',()=>{
 assert.match(PERSONA,/without volunteering internal production tools/);
 assert.match(PERSONA,/Never claim artwork is entirely human-made/);
 assert.match(PERSONA,/asked directly about AI involvement.*answer truthfully/);
});
