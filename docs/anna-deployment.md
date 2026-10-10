# Anna: streamer prospecting and Savannah handoff

## Current status

The owner-approved campaign is active. ANNA_AUTO_SEND=true is mirrored in Wrangler; setting it to false pauses new outreach. Discovery automation anna-streamer-prospecting runs daily at 9:00 AM America/Chicago. It may submit up to five verified leads, but never fills the quota with weak or unverified contacts. After 14 days, evaluate qualified responses before gradually testing larger channels; initial runtime currently admits only the smaller-growing-streamer segment.

On October 9, 2026 at 10:46 PM Central, the real Anna-inbox test received a threaded Savannah response within 24 seconds. Display name was exactly Savannah | Obsidian Reign Studios, from anna@obsidianreign.gg. At 10:54 PM Central, the first approved streamer introduction was confirmed in Anna's Sent folder under Anna | Obsidian Reign Studios. Sent retention confirms provider submission, not recipient inbox delivery. Private recipient data remains under ignored .wrangler files.

## Approved campaign

config/anna-campaign.json records Philip's direct approval: English-speaking smaller growing streamers, emotes, stream branding and stream kits, warm/casual/professional factual personalization, five initial emails per Chicago calendar day, and campaign-level approval. No new approval is required for each eligible prospect. No automatic follow-up sequence is implemented.

Public business mailing address: Obsidian Reign Studios, 834-F S Perry Street #1258, Castle Rock, CO 80104. The owner confirmed mailbox activation and identity verification. Every introduction identifies the studio, includes this address and commercial purpose, and offers a reply-based opt-out.

Discovery must review creator-owned public business contact sources, actual recipient location, channel rules, fit and source freshness. Start with verified U.S. recipients. Public contact alone is not blanket permission; do not guess addresses, buy lists, bypass gated contact information or ignore no-solicitation instructions. Never invent having watched streams, experience, results, pricing or discounts. Relevant factual observations must be supported by recorded source URLs.

## Production architecture

Anna uses a separate Hostinger mailbox, anna@obsidianreign.gg, resource AC087f44100a23d1b44998ca5baa35. The public Mail API does not expose a documented alias/from/replyTo send field, so the earlier alias approach was replaced by this separate mailbox. Worker SMTP probes failed before authentication; the unused SMTP password is not required for this runtime.

POST /webhooks/hostinger/anna authenticates deliveries with ANNA_WEBHOOK_SECRET and validates mailbox identity. It fetches full messages and threads using Anna's own API credentials. Both mailboxes share SavannahInbox's durable contact registry. Savannah responds in Anna's existing thread using Anna's mailbox and exact Savannah display name; this is a persona handoff rather than forwarding. Direct Savannah-inbox replies retain Savannah's own sender address.

POST /api/anna/prospects requires the separate scoped ANNA_AGENT_TOKEN. Do not use portal credentials. src/anna-runtime.js reserves contacts atomically, checks suppression/prior replies immediately before sending, enforces five daily reservations and five actual attempts per America/Chicago day, and records the attempt before calling Hostinger. Ambiguous sends become send-outcome-unknown and are never automatically retried. Source evidence expires after seven days. The approved fixed template and exact Anna display name are enforced server-side.

Inbound explicit opt-outs persist suppression before AI or any customer reply, including previously unknown contacts. Responses from an existing prospect mark it replied and stop additional outreach. Suppression is never cleared by a reply. Savannah ignores spam/newsletters and escalates sensitive or uncertain inquiries under her existing policy.

## Bindings and secrets

Text variables: ANNA_MAILBOX_ID, ANNA_AUTO_SEND. Secret variables: ANNA_MAIL_API_TOKEN, ANNA_WEBHOOK_SECRET, ANNA_AGENT_TOKEN. Existing Savannah secrets and Durable Object binding remain required. Never commit credentials, private lead records or mail contents. Production API secrets were configured without exporting their values. The local scoped queue credential is ignored by Git.

Submit a privately verified lead with node scripts/anna-queue.mjs queue PRIVATE_LEAD_JSON. Required fields include email, name, observation, channelUrl, contactSourceUrl, verifiedAt, publicBusinessContact=true, contactVerified=true, outreachEligible=true, language=English, segment=smaller growing streamers. These flags document completed review; they do not establish eligibility by themselves. A 202 response means queued, not sent. Confirm outcomes before reporting success or considering any manual recovery.

The legacy scripts/anna-agent.mjs preparation/fingerprint utility does not control the active campaign. Its per-batch approval foundation predates Philip's campaign approval and the durable runtime.

## Validation and deployment

46 combined Anna, Savannah and portal checks passed. Real inbound handoff and first outbound introduction were confirmed in Sent. Public site/portal returned 200; unauthorized prospect and webhook requests returned 401; authenticated webhook configuration verification returned 200. Temporary authenticated inspection/setup routes were removed.

Current production uses an Anna inbox module integrated into the existing Worker. Deployment helpers preserve all current modules, assets, text variables, secrets and Durable Object bindings. Do not upload an old single-module snapshot or old static-site assets. The repository source imports the same Anna runtime directly for future normal builds. Keep Wrangler's campaign switch synchronized with production.
