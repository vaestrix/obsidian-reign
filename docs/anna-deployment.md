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


## Confirmed campaign settings

`config/anna-campaign.json` records the owner-approved targeting: English-speaking smaller growing streamers, five emails per day and one campaign approval. Gradual larger-channel tests may follow weak results without automatically raising volume. The owner confirmed the business private mailbox is active and identity verification complete: Obsidian Reign Studios, 834-F S Perry Street #1258, Castle Rock, CO 80104. This is an intentionally public business mailing address, not a secret. Sending remains off pending sender provisioning, final campaign template approval and dispatcher/registry checks.

Savannah now durably records explicit outreach opt-outs before AI or customer sending. The contact key is a SHA-256 hash of the normalized sender email under `anna:contact:` in the mailbox Durable Object. An inbound response from an existing Anna contact marks it replied; a previous suppressed state is never cleared by a response. The future Anna dispatcher must read this same registry immediately before sending. This opt-out registry hook is live infrastructure, not an enabled outreach campaign.


## Alias compatibility check

The owner created anna@obsidianreign.gg as an alias of Savannah. Hostinger webmail supports sending from an alias, but the current public Mail API Send schema exposes displayName and no from/alias/replyTo field. Do not send an undocumented from field or claim that displayName changes the email address. Automated Anna-alias sending remains unverified. Options are API outreach from the managed Savannah mailbox with Anna displayName, or a separate managed Anna mailbox with its own inbound handoff.

Savannah now accepts full messages addressed to the Anna alias inside her authenticated managed mailbox, replies under Savannah’s established identity, and ignores self-mail from either studio address. Webhook mailbox authentication still validates the managed Savannah address and secret. No sending campaign was enabled.

## SMTP alias investigation

An unauthenticated, certificate-validated TLS probe to smtp.hostinger.com:465 succeeded. EHLO advertised AUTH PLAIN LOGIN. No login or email was attempted. Hostinger documents SMTP configuration, while alias sending is explicitly documented for webmail; SMTP alias acceptance remains a test hypothesis, not verified support.

`scripts/anna-smtp-probe.mjs` tests password login for savannah@obsidianreign.gg and MAIL FROM for anna@obsidianreign.gg, then resets the transaction and quits. It never issues DATA, so it cannot send an email. Supply HOSTINGER_SMTP_PASSWORD through a secure runtime environment, never source, command arguments or chat. The Mail API token is not an SMTP password. Certificate validation and a 15-second socket timeout are enforced. Credentials and SMTP authentication payloads are never logged.

Successful MAIL FROM alone is not complete sender verification. Before activating outreach, send one controlled test to the owner through the chosen transport and inspect received From, Reply-To, authentication, Sent retention and reply handoff. Do not retry an uncertain send. The automatic dispatcher is still not enabled.

## Cloudflare SMTP secret test result

The owner added HOSTINGER_SMTP_PASSWORD as a production Cloudflare secret. Binding type was confirmed without reading or exporting its value. Temporary, randomly authenticated runtime probes attempted smtp.hostinger.com:465 with implicit TLS and :587 with STARTTLS. Both failed on socket.opened with "proxy request failed, cannot connect to the specified address", before authentication. Thus the password and alias envelope acceptance remain untested; this result concerns the Worker transport, not whether Hostinger generally supports SMTP aliases. The earlier workstation TLS capability probe succeeded on 465.

All temporary imports/routes/helpers were removed after each test with current-deployment readback, keeping secrets, bindings and assets. No SMTP DATA or email was sent. Do not describe the campaign as active. Options: a separately provisioned Anna mailbox using the already-working Mail API, or a separately secured SMTP relay outside this Worker after testing. Do not provision a new paid relay without the owner's chosen approach.


Anna’s separately provisioned mailbox is verified through the production ANNA_MAIL_API_TOKEN secret: anna@obsidianreign.gg, resource AC087f44100a23d1b44998ca5baa35. ANNA_MAILBOX_ID is a production text binding and is mirrored in Wrangler configuration. API token value was not read or exported. A temporary authenticated /me lookup succeeded and was removed. Outbound campaign remains disabled; separate-mailbox reply handoff, shared-registry dispatcher and campaign-template approval remain required.


## Approved campaign runtime

The owner approved the warm, casual, professional approach promoting emotes, stream branding and stream kits, with personalized factual introductions, business mailing address and reply-based opt-out. Approval provenance is recorded in the campaign configuration. No fresh approval per prospect is required within this campaign.

Live infrastructure: Anna Mail API token, mailbox ID, separate ANNA_WEBHOOK_SECRET, scoped ANNA_AGENT_TOKEN, protected POST /api/anna/prospects, and active message.received callback /webhooks/hostinger/anna. Anna runtime shares Savannah’s Durable Object contact registry. It durably reserves contacts and send attempts, enforces five daily reservations and five actual send attempts in America/Chicago, cancels suppressed/replied contacts and never automatically retries an uncertain send. Verified source evidence must be at most seven days old. It sends only the approved template under Anna | Obsidian Reign Studios. The separate Anna token handles Anna's threads. Savannah's persona responds to Anna-inbox replies with display name Savannah | Obsidian Reign Studios from the Anna mailbox, preserving the reply thread; direct Savannah-inbox replies keep Savannah's own address. This is a persona handoff, not mailbox forwarding.

Production ANNA_AUTO_SEND=false remains the outreach kill switch until a real inbound reply test succeeds. No prospects contacted. Prospect discovery and recurring scheduling are not yet configured. Local tests: 46 combined Anna, Savannah and portal checks pass; live site/portal return 200, unauthorized Anna API and webhook return 401. Authenticated webhook verification returned 200 and temporary setup routes were removed.

Private verified leads can be submitted with node scripts/anna-queue.mjs queue PRIVATE_LEAD_JSON. The local scoped credential is ignored by Git. Do not use the portal credential for outreach. Required lead fields match outreachMessage in src/anna-runtime.js, including English language, smaller-growing-streamer segment, public business contact, actual source verification and outreach eligibility. Flags alone do not establish permission: discovery must verify jurisdiction and contact instructions. Automatic audience expansion remains a future evaluation feature; the initial runtime restricts the smaller segment rather than silently widening it.

