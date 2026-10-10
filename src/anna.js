import { createHash } from 'node:crypto';
export const ANNA_NAME = 'Anna | Obsidian Reign Studios';
export const HANDOFF_EMAIL = 'savannah@obsidianreign.gg';
const address = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
const bounded = (value, max) => typeof value === 'string' && value.trim() && value.length <= max;
const https = value => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
export function prepareBatch(campaign, leads) {
  if (!bounded(campaign.id, 80) || !bounded(campaign.businessAddress, 500) || !bounded(campaign.contactName, 100)) throw Error('Campaign identity and business mailing address are required.');
  if (!Number.isInteger(campaign.dailyLimit) || campaign.dailyLimit < 1 || campaign.dailyLimit > 10) throw Error('Initial daily limit must be 1–10.');
  if (!Array.isArray(leads) || !leads.length || leads.length > campaign.dailyLimit) throw Error('Batch exceeds the approved daily limit.');
  const seen = new Set();
  const messages = leads.map(lead => {
    const to = typeof lead.email === 'string' ? lead.email.trim().toLowerCase() : '';
    if (!address.test(to) || seen.has(to) || to === HANDOFF_EMAIL) throw Error('Invalid or duplicate prospect address.');
    seen.add(to);
    if (!bounded(lead.name, 100) || !https(lead.channelUrl) || !https(lead.contactSourceUrl) ||
        lead.publicBusinessContact !== true || lead.contactVerified !== true || lead.outreachEligible !== true ||
        lead.suppressed || lead.alreadyContacted || lead.alreadyReplied) throw Error('Prospect requires verified public business contact, eligibility and suppression checks.');
    if (!bounded(lead.observation, 400) || /[\r\n]/.test(lead.name) || !bounded(lead.verifiedAt, 40) || !Number.isFinite(Date.parse(lead.verifiedAt))) throw Error('Verified prospect evidence is required.');
    const age = Date.now() - Date.parse(lead.verifiedAt);
    if (age < -60000 || age > 7 * 86400000) throw Error('Prospect verification must be within seven days.');
    if (/https?:|\$|guarantee|discount|free trial|i watched|we watched|six years|6 years/i.test(lead.observation)) throw Error('Observation must be factual and contain no sales promises or invented experience.');
    return { to, displayName: ANNA_NAME, replyTo: HANDOFF_EMAIL, subject: 'Creator design inquiry from Obsidian Reign Studios',
      text: `Hi ${lead.name},\n\nI'm Anna with Obsidian Reign Studios. ${lead.observation.trim()}\n\nWe create emotes, creator branding and stream assets. If you are considering an update to your creator setup, would you like to share what you have in mind? Savannah can help you explore the scope; just reply to ${HANDOFF_EMAIL}.\n\nAnna | Obsidian Reign Studios\nBusiness contact: ${campaign.contactName}\n${campaign.businessAddress.trim()}\n\nThis is a commercial introduction from Obsidian Reign Studios. To opt out, reply to ${HANDOFF_EMAIL} with “stop outreach”.`,
      evidence: { channelUrl: lead.channelUrl, contactSourceUrl: lead.contactSourceUrl, verifiedAt: lead.verifiedAt } };
  });
  const batch = { schema: 1, campaignId: campaign.id, dailyLimit: campaign.dailyLimit, messages };
  return { ...batch, approvalFingerprint: fingerprint(batch), status: 'awaiting-human-approval' };
}
export function fingerprint(batch) {
  return createHash('sha256').update(JSON.stringify({ schema: batch.schema, campaignId: batch.campaignId, dailyLimit: batch.dailyLimit, messages: batch.messages })).digest('hex');
}
export function validateApproval(batch, approval) {
  if (!approval || approval.approvedBy !== 'Philip' || approval.fingerprint !== fingerprint(batch) || !Number.isFinite(Date.parse(approval.approvedAt))) return false;
  const elapsed = Date.now() - Date.parse(approval.approvedAt);
  return elapsed >= 0 && elapsed <= 86400000;
}

