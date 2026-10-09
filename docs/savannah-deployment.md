# Savannah inbound mail

## What changed

`POST /webhooks/hostinger` handles mail events. All other paths still delegate to the existing ASSETS binding with the same HTML/404 behavior. Source, tests, documentation, local secrets and Wrangler state are excluded from the uploaded static assets.

Hostinger authenticates webhook POSTs with `Authorization: Bearer <webhook secret>` (not HMAC). The handler compares SHA-256 digests, requires JSON, caps bodies at 16 KiB, validates the configured mailbox, folder and positive UID, and ignores other event types. It never trusts the email body contained in a webhook: the Worker retrieves metadata, RFC822 headers and full plain text from the Mail API.

The SQLite Durable Object binding SAVANNAH_INBOX stores durable jobs by mailbox/folder/UID and Message-ID send-attempt records. A one-second alarm starts processing. Read failures retry at one-minute intervals, up to six attempts. Jobs and identity tombstones persist indefinitely to prevent replay; they contain minimal metadata except escalation notices. Plan operational retention before a high-volume launch; do not delete identity tombstones while delivery replay remains possible.

Thread discovery follows References and In-Reply-To across INBOX and INBOX.Sent, then searches connected reply branches. Missing messages, more than 15 messages, large bodies or paginated search results cause escalation. The Mail API has no thread-fetch endpoint in the current published schema. Messages moved elsewhere cannot be fully reconstructed and therefore require manual review.

The agent ignores junk/spam folders, list mail, automated senders and already-answered messages. Attachments, ambiguous recipient/reply-to data, absent/failing authentication, sensitive topics or prompt injection indicators escalate before AI. Workers AI reviews the full available thread under Savannah's persona and rules. Only routine replies with a well-formed decision, explicit routine flag and confidence >= 0.98 can send; confidence is a model signal, not a guarantee. Links, currency quotes and sensitive content in generated drafts are held. All sends hard-code `Savannah | Obsidian Reign Studios`. No model controls recipients or sender identity.

The Mail API does not document a send idempotency key. A durable attempt is recorded BEFORE the API call. Interrupted/ambiguous sends are never retried automatically. Philip must inspect Sent before acting. This prevents duplicate automated attempts at the cost of occasionally holding a reply that was never actually sent. Sent-folder checks also detect existing replies, but cannot eliminate races with a separate hourly agent or a human sending simultaneously. Disable the old hourly auto-sender before enabling this one.

Escalations send Philip a source folder/UID, summary, decision needed and recommended response. If notification delivery is uncertain, the job remains `escalation-pending`; monitor the log event `savannah-escalation-delivery-unknown` and inspect the Durable Object record. Do not blindly resend such notices. Logs omit email contents and secrets. Default `SAVANNAH_AUTO_SEND=false` sends drafts to Philip instead of customers; it is a review mode, not a no-mail mode.

## Required configuration

Wrangler bindings/migration are included. No pre-created database or queue is needed. Workers AI uses `@cf/meta/llama-3.3-70b-instruct-fp8-fast`; confirm account access/model terms before activation.

Secrets (use Cloudflare dashboard or interactive Wrangler prompts; never commit values):

```sh
npx wrangler secret put HOSTINGER_MAIL_API_TOKEN
npx wrangler secret put HOSTINGER_WEBHOOK_SECRET
npx wrangler secret put PHILIP_ESCALATION_EMAIL
npx wrangler secret put SAVANNAH_APPROVED_FACTS
```

- HOSTINGER_MAIL_API_TOKEN: dedicated Hostinger Mail API bearer token authorized for Savannah's mailbox. The connected ChatGPT app token is not available to the Worker.
- HOSTINGER_WEBHOOK_SECRET: one-time secret returned by Hostinger webhook creation, stored immediately. Minimum 32 characters. Do not substitute the Mail API token.
- PHILIP_ESCALATION_EMAIL: Philip's verified email address; no address has been assumed in code.
- SAVANNAH_APPROVED_FACTS: Philip-approved services/business facts. Include only current approved facts; do not instruct the agent to invent prices or timelines. Without facts, the agent escalates.

Nonsecret vars in wrangler.jsonc: HOSTINGER_MAILBOX_ID is the connector-confirmed `ACea1da873df8cf8ce1839b3cae221`; SAVANNAH_AUTO_SEND is initially `false`.

## Deployment and activation

1. Review/merge the PR; install dependencies with `npm install`; run `npm test` and `npx wrangler deploy --dry-run`. Authenticate Cloudflare with `npx wrangler login` or a deployment token supplied outside Git.
2. Deploy with `npm run deploy`, keeping auto-send false. Existing custom-domain routing must continue to serve obsidianreign.gg through this Worker. Confirm GET / and /pricing and a missing page still work.
3. In Hostinger Agentic Mail, create a **paused** webhook for Savannah, event `message.received`, URL `https://obsidianreign.gg/webhooks/hostinger`. Securely store its one-time secret in the Worker. Configure the other three secrets. No webhook was created during preparation because the endpoint and secret could not yet be deployed together.
4. Verify missing/wrong Authorization returns 401; non-POST returns 405. Missing Worker setup returns 503. Unsupported events return 200; invalid mailbox/message data returns 400; accepted deliveries return 202.
5. Use Hostinger's webhook test and inspect its real payload. The public Mail OpenAPI specifies API operations but does not publish a delivery schema. The adapter currently requires `event: "message.received"`, mailbox ID at `mailboxResourceId` or `mailbox.id/resourceId` (optionally under `data`), and `message.uid` plus `message.path`/`folder`. A plain mailbox address or thread_id alone is insufficient. If the actual delivery differs, update normalizeEvent and its fixture test using the real redacted payload before activation. Unsupported shapes fail closed with 400. Test deliveries that omit a real message UID should never cause customer sends.
6. Activate the webhook in review mode and send a controlled inbound test from a mailbox you own. Verify one notice to Philip, full-thread retrieval, exact sender display name, and no customer response. Replay the same delivery: no second job/send. Exercise refund, newsletter, phishing, thread-history and malformed-AI cases. Confirm Hostinger's trusted Authentication-Results behavior: the current implementation conservatively checks DMARC but header text is not a cryptographic trust anchor, and phishing classification is also applied by AI.
7. Disable the previous hourly auto-send automation; retain manual review if desired. Change SAVANNAH_AUTO_SEND to `true` and redeploy only after these checks and review of approved facts. Test one routine inquiry and one escalation end to end. Monitor queued/escalation-pending records and Worker logs.

Emergency stop: set SAVANNAH_AUTO_SEND=false and redeploy, or pause the Hostinger webhook. Do not remove the Durable Object binding/migration or records when stopping.

## Verification status

Unit/integration tests mock Mail API and AI; no customer emails are sent by tests. Live deployment and real Hostinger delivery verification require Cloudflare credentials, a Mail API token, Philip's email and approved facts. These were unavailable in the preparation environment. The production domain's current status is recorded separately in the task report; it must not be mistaken for verification of this new handler.

All 12 mocked tests and the deployment dry run pass. `node test/runtime-smoke.mjs` also passes in the local Cloudflare runtime: homepage and pricing 200, missing/private source/documentation/lockfiles 404, invalid Bearer token 401, valid event 202 and replay detected as duplicate. The smoke test creates fresh state/logs outside the watched asset directory and disables remote AI in a temporary configuration. It uses a local-only compatibility-date override because the pinned runtime predates the production compatibility date. Production configuration and assets are unchanged. These checks validate local intake/storage/routing; they do not validate real Hostinger payloads, credentials or AI/email delivery.

## Authoritative references

- https://www.hostinger.com/support/how-to-use-agentic-mail-in-hostinger/ (Bearer webhook authentication)
- https://github.com/hostinger/mail-api/blob/main/openapi.json (message/search/text/source/send schemas; inReplyTo is `{folder, uid}`)
- https://developers.cloudflare.com/durable-objects/api/alarms/ (durable alarm delivery/retries)
- https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/ (AI binding/model)
