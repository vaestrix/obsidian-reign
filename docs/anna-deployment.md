# Anna: streamer prospecting and Savannah handoff

Status: approval-ready batch preparation implemented; discovery, durable suppression, sending and scheduling are not active. No prospects contacted. This module is not imported by the Worker, so current site and Savannah behavior are unchanged.

Anna is Obsidian Reign Studios' prospecting assistant. Find streamers using public channel and business-contact pages, record a relevant factual observation and source URLs, and qualify fit for approved creator-design services. Never invent having watched a stream, personal experience, customer results or pricing. No guessed addresses, purchased lists or bypassing gated contact information. Public contact alone does not establish outreach permission: verify jurisdiction, channel rules and outreach eligibility before including a lead.

Run `node scripts/anna-agent.mjs prepare INPUT_JSON` with an object containing `campaign` and `leads`. Campaign fields: id, businessAddress, contactName, dailyLimit (1–10). Each lead requires email, name, channelUrl, contactSourceUrl, publicBusinessContact=true, contactVerified=true, outreachEligible=true, verifiedAt (within seven days), observation. Suppressed, previously contacted and already-replied leads are rejected. The preparation tool never sends email and does not prove eligibility on its own; the flags must reflect completed source/registry checks.

The private output is `.wrangler/anna/pending-batch.json`, ignored by Git. Review exact recipients, evidence, sender, subject, message, physical address and reply routing before approval. An immutable SHA-256 fingerprint binds approval to the exact batch; edits invalidate approval. Approvals expire after 24 hours. `validateApproval` is a foundation for the future send gate, not an active sending mechanism. No agent may self-approve as Philip.

Replies must route to savannah@obsidianreign.gg. Anna's outreach identity is Anna | Obsidian Reign Studios, with an accurately provisioned sending mailbox. Savannah retains her exact separate sender display name. Verify Hostinger supports the chosen Reply-To behavior and test it before production sending.

Before sending is enabled:

1. Philip supplies targeting/language, approval scope and valid business mailing address/contact name.
2. Select and verify sender mailbox and provider's outbound outreach rules.
3. Implement a shared durable contact registry, authenticated batch approval and atomic send reservations. Never retry ambiguous sends without checking Sent.
4. Implement and test immediate opt-out suppression before Savannah's sensitive-message gate. Current Savannah escalates unsubscribe requests; that alone is not automated suppression and must not be treated as sufficient.
5. Check suppression and prior response immediately before every send; stop outreach on reply, opt-out, bounce or complaint. Begin with one initial email per prospect and no automatic follow-up sequence.
6. Add the approved-batch dispatcher and an authorized schedule only after end-to-end tests and explicit human approval. Keep a kill switch and conservative volume limit.

U.S. commercial outreach requirements include accurate headers, honest subjects, advertisement identification, valid physical mailing address and a functioning opt-out mechanism. See https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business . Other jurisdictions may require consent; the eligibility review must account for recipient location.

Tests cover review preparation, exact-message approval binding/expiry and rejection of unverified, duplicate or suppressed contacts. No secrets or real prospect data are committed.

