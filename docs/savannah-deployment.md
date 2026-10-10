# Savannah inbound mail

## What changed

`POST /webhooks/hostinger` handles mail events. All other paths delegate to the preserved production Worker, retaining admin, Discord, guild APIs and the CommandStore Durable Object. Public pages retain the ASSETS binding and HTML/404 behavior. The build copies only HTML, robots.txt, sitemap.xml and assets into dist; source, tests, documentation, local secrets and Wrangler state are not published.

Hostinger authenticates webhook POSTs with `Authorization: Bearer <webhook secret>` (not HMAC). The handler compares SHA-256 digests, requires JSON, caps bodies at 16 KiB and validates the mailbox. The observed Hostinger sample uses `data.mailboxAddress` and `data.messageId`; the latter is resolved to a folder/UID through an exact Message-ID match in the authenticated Mail API. Legacy folder/UID deliveries are also supported. Unknown shapes fail closed. Webhook previews and `bodyUrl` are ignored: full message contents come only from the fixed Mail API origin.

The SQLite Durable Object binding SAVANNAH_INBOX stores durable jobs by mailbox/folder/UID and Message-ID send-attempt records. A one-second alarm starts processing. Read failures retry at one-minute intervals, up to six attempts. Jobs and identity tombstones persist indefinitely to prevent replay; they contain minimal metadata except escalation notices. Plan operational retention before a high-volume launch; do not delete identity tombstones while delivery replay remains possible.

Thread discovery follows References and In-Reply-To across INBOX and INBOX.Sent, then searches connected reply branches. Missing messages, more than 15 messages, large bodies or paginated search results cause escalation. The Mail API has no thread-fetch endpoint in the current published schema. Messages moved elsewhere cannot be fully reconstructed and therefore require manual review.

The agent ignores junk/spam folders, list mail, automated senders and already-answered messages. Attachments, ambiguous recipient/reply-to data, absent/failing authentication, sensitive topics or prompt injection indicators escalate before AI. Workers AI reviews the full available thread under Savannah's persona and rules. Only routine replies with a well-formed decision, explicit routine flag and confidence >= 0.98 can send; confidence is a model signal, not a guarantee. Links, currency quotes and sensitive content in generated drafts are held. All sends hard-code `Savannah | Obsidian Reign Studios`. No model controls recipients or sender identity.

The Mail API does not document a send idempotency key. A durable attempt is recorded BEFORE the API call. Interrupted/ambiguous sends are never retried automatically. Philip must inspect Sent before acting. This prevents duplicate automated attempts at the cost of occasionally holding a reply that was never actually sent. Sent-folder checks also detect existing replies, but cannot eliminate races with a separate hourly agent or a human sending simultaneously. Disable the old hourly auto-sender before enabling this one.

Escalations send Philip a source folder/UID, summary, decision needed and recommended response. If notification delivery is uncertain, the job remains `escalation-pending`; monitor the log event `savannah-escalation-delivery-unknown` and inspect the Durable Object record. Do not blindly resend such notices. Logs omit email contents and secrets. `SAVANNAH_AUTO_SEND=false` sends drafts to Philip instead of customers; it is a review mode, not a no-mail mode. Production is now enabled with `true`; new installations should start in review mode.

## Required configuration

Wrangler bindings/migration are included. No pre-created database or queue is needed. Workers AI uses `@cf/meta/llama-3.3-70b-instruct-fp8-fast`; confirm account access/model terms before activation.

Secrets (use Cloudflare dashboard or interactive Wrangler prompts; never commit values):

```sh
npx wrangler secret put HOSTINGER_MAIL_API_TOKEN
npx wrangler secret put HOSTINGER_MAILBOX_ID
npx wrangler secret put HOSTINGER_WEBHOOK_SECRET
npx wrangler secret put PHILIP_ESCALATION_EMAIL
npx wrangler secret put SAVANNAH_APPROVED_FACTS
```

- HOSTINGER_MAIL_API_TOKEN: dedicated Hostinger Mail API bearer token authorized for Savannah's mailbox. The connected ChatGPT app token is not available to the Worker.
- HOSTINGER_WEBHOOK_SECRET: one-time secret returned by Hostinger webhook creation, stored immediately. Minimum 32 characters. Do not substitute the Mail API token.
- PHILIP_ESCALATION_EMAIL: Philip's verified email address; no address has been assumed in code.
- SAVANNAH_APPROVED_FACTS: already configured with service categories and the scope-before-payment process verified from the live services/start-project pages. The fact pack authorizes routine qualification only and contains no numeric prices, payment links, guarantees, usage-right promises or deadlines. Update it when published business information changes. Without facts, the agent escalates.

HOSTINGER_MAILBOX_ID is configured in production as a secret with the connector-confirmed value `ACea1da873df8cf8ce1839b3cae221`. Keep it out of `vars` to avoid replacing the dashboard binding on deployment. The nonsecret vars PUBLIC_ORIGIN and SAVANNAH_AUTO_SEND match the dashboard; production auto-send is `true`. The dashboard's configuration-sync banner is informational, not a runtime error.

## Deployment and activation

1. Review/merge the PR; install dependencies with `npm install`; run `npm test` and `npx wrangler deploy --dry-run`. Authenticate Cloudflare with `npx wrangler login` or a deployment token supplied outside Git.
2. Deploy with `npm run deploy`, keeping auto-send false. Existing custom-domain routing must continue to serve obsidianreign.gg through this Worker. Confirm GET / and /pricing and a missing page still work.
3. The existing webhook `01a122ad-2ddf-71f9-ac8f-d9b4dbb0095e` is active with routine auto-send enabled: event `message.received`, URL `https://obsidianreign.gg/webhooks/hostinger`. All required production secrets are configured. Reuse this webhook; do not create a duplicate. For a new installation, keep deliveries paused until credentials and controlled checks are complete. Never paste credentials into chat or commit them.
4. Verify missing/wrong Authorization returns 401; non-POST returns 405. Missing Worker setup returns 503. Unsupported events return 200; invalid mailbox/message data returns 400; accepted deliveries return 202.
5. Hostinger's sample webhook test now succeeds with HTTP 202. Its envelope has `event: "message.received"` and `data.mailboxAddress`/`data.messageId`; no UID is supplied. An authenticated Mail API search resolves the RFC Message-ID to a UID, with exact-match checks, bounded pagination and retries for delayed visibility. Junk/Spam matches are ignored. Real inbound mail and full-thread fetches still need a controlled test after the remaining secrets are configured. Do not infer readiness to auto-send from a sample delivery alone.
6. Activate the webhook in review mode and send a controlled inbound test from a mailbox you own. Verify one notice to Philip, full-thread retrieval, exact sender display name, and no customer response. Replay the same delivery: no second job/send. Exercise refund, newsletter, phishing, thread-history and malformed-AI cases. Confirm Hostinger's trusted Authentication-Results behavior: the current implementation conservatively checks DMARC but header text is not a cryptographic trust anchor, and phishing classification is also applied by AI.
7. Disable the previous hourly auto-send automation; retain manual review if desired. Change SAVANNAH_AUTO_SEND to `true` and redeploy only after these checks and review of approved facts. Test one routine inquiry and one escalation end to end. Monitor queued/escalation-pending records and Worker logs.

Emergency stop: set SAVANNAH_AUTO_SEND=false and redeploy, or pause the Hostinger webhook. Do not remove the Durable Object binding/migration or records when stopping.

## Verification status

On October 9, 2026, the controlled inbound Test (INBOX UID 3) was read and escalated successfully. Sent UID 2 has subject `[Savannah review] Message 3`, the exact sender `Savannah | Obsidian Reign Studios`, and the configured escalation recipient. Customer replies were disabled during that test. Hostinger sample deliveries return 202; authenticated Mail API folder access returns 200. Production was subsequently activated after the user confirmed notification receipt and the older sender was paused.

All 17 mocked tests pass, including redirects and structured AI responses. `node test/runtime-smoke.mjs` passes: public pages 200, missing/private files 404, invalid Bearer token 401, valid delivery/replay 202. It supplies test-only bindings, uses fresh state/logs and disables remote AI in a temporary configuration.

Real-runtime verification exposed two compatibility issues, now corrected: Workers supports `redirect: manual`, and non-success/redirect status is explicitly rejected; Workers AI can return an already-parsed decision object as well as JSON text, so both receive identical conservative validation. A synthetic routine inquiry produced routine=true/confidence=0.9 and was correctly held below the 0.98 threshold. All temporary replay/credential/AI hooks were removed; safe operation/status logs remain. The production site and client portal were preserved. Previous failed test jobs remain held to prevent blind retries.

Philip confirmed receipt of the review notice and reported that the previous hourly Savannah task is paused. Production SAVANNAH_AUTO_SEND=true was then set and read back successfully. The active webhook now permits only routine decisions passing all checks; sensitive/uncertain inquiries continue to escalate. Code, assets, portal and secrets were preserved during activation. A real routine customer reply has not yet been observed; send a realistic service inquiry for that final live check. Prior held test jobs are not blindly replayed.

## Authoritative references

- https://www.hostinger.com/support/how-to-use-agentic-mail-in-hostinger/ (Bearer webhook authentication)
- https://github.com/hostinger/mail-api/blob/main/openapi.json (message/search/text/source/send schemas; inReplyTo is `{folder, uid}`)
- https://developers.cloudflare.com/durable-objects/api/alarms/ (durable alarm delivery/retries)
- https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/ (AI binding/model)

