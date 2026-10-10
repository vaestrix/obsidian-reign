import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareBatch, validateApproval, HANDOFF_EMAIL } from '../src/anna.js';
const campaign = { id: 'streamers-first', businessAddress: 'Test business address', contactName: 'Philip', dailyLimit: 5 };
const lead = { email: 'creator@example.com', name: 'Creator', channelUrl: 'https://example.com/channel', contactSourceUrl: 'https://example.com/business', publicBusinessContact: true, contactVerified: true, outreachEligible: true, verifiedAt: new Date().toISOString(), observation: 'Your channel focuses on cooperative games.' };
test('Anna prepares reviewable outreach with Savannah handoff and opt-out', () => {
 const b = prepareBatch(campaign, [lead]);
 assert.equal(b.status, 'awaiting-human-approval'); assert.equal(b.messages[0].replyTo, HANDOFF_EMAIL);
 assert.match(b.messages[0].text, /stop outreach/); assert.match(b.messages[0].text, /commercial introduction/);
});
test('approval is bound to exact batch and expires', () => {
 const b = prepareBatch(campaign, [lead]); const a = { approvedBy: 'Philip', approvedAt: new Date().toISOString(), fingerprint: b.approvalFingerprint };
 assert.ok(validateApproval(b, a)); b.messages[0].to = 'different@example.com'; assert.equal(validateApproval(b, a), false);
 a.approvedAt = new Date(Date.now() - 2 * 86400000).toISOString(); assert.equal(validateApproval(prepareBatch(campaign, [lead]), a), false);
});
test('suppressed, contacted, unverified or ineligible prospects cannot enter batch', () => {
 for (const patch of [{ suppressed: true }, { alreadyContacted: true }, { alreadyReplied: true }, { contactVerified: false }, { outreachEligible: false }, { publicBusinessContact: false }]) assert.throws(() => prepareBatch(campaign, [{ ...lead, ...patch }]));
 assert.throws(() => prepareBatch(campaign, [lead, lead])); assert.throws(() => prepareBatch({ ...campaign, businessAddress: '' }, [lead]));
});

