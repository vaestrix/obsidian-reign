import test from 'node:test';
import assert from 'node:assert/strict';
import {planCreativeProduction} from '../src/creative-planner.js';
const base={projectId:'p1',platform:'twitch',description:'A detailed expressive character concept with consistent facial features.'};
test('animated emote plan requires animation and internal-only Vesper',()=>{
 const plan=planCreativeProduction({...base,assetType:'animated_emote'});
 assert.equal(plan.needsAnimation,true);
 assert.equal(plan.producer,'vesper');assert.equal(plan.customerContact,'savannah');
 assert.equal(plan.status,'planning_only');
});
test('static emotes are not unnecessarily routed to animation',()=>{
 const plan=planCreativeProduction({...base,assetType:'emote'});
 assert.equal(plan.needsAnimation,false);
 assert.equal(plan.desiredOutput,'transparent_png');
});
test('planning does not select a paid provider or claim cost',()=>{
 const plan=planCreativeProduction({...base,assetType:'alert'});
 assert.equal(plan.provider,'unselected');assert.equal(plan.model,'unselected');assert.equal(plan.estimatedCostCents,null);
});
