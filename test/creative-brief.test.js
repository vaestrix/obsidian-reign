import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCreativeBrief,productionReadiness} from '../src/creative-brief.js';
const base={projectId:'project-123',assetType:'animated_emote',platform:'twitch',description:'Animated vampire emote with violet eyes and black hair.'};
test('valid creator brief is a non-executing draft',()=>{
 const brief=validateCreativeBrief(base);
 assert.equal(brief.status,'draft');assert.equal(brief.requiresCustomerApproval,true);
 assert.equal(productionReadiness(brief).ready,false);
});
test('reject unsupported asset types and insecure references',()=>{
 assert.equal(validateCreativeBrief({...base,assetType:'unapproved'}),null);
 assert.equal(validateCreativeBrief({...base,referenceUrls:['http://example.com/reference.png']}),null);
 assert.equal(validateCreativeBrief({...base,referenceUrls:['https://user:pass@example.com/file']}),null);
});
test('production requires customer approval, payment and owner generation approval',()=>{
 const brief=validateCreativeBrief(base);
 assert.equal(productionReadiness({...brief,status:'approved'}).ready,false);
 assert.equal(productionReadiness({...brief,status:'approved',paymentAuthorized:true}).ready,false);
 assert.equal(productionReadiness({...brief,status:'approved',paymentAuthorized:true,ownerGenerationApproved:true}).ready,true);
});
