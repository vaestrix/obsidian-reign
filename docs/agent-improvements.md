# Agent improvement record

## October 10, 2026 — natural opt-outs

Research checked official Hostinger Agentic Mail guidance and current Mail API schema, Cloudflare Workers AI changelog and JSON-mode documentation. Existing Bearer authentication remains supported. Cloudflare explicitly keeps the deployed llama-3.3 fast variant active. Newer models are candidates for offline evaluation rather than an automatic production migration. JSON mode is supported but can still fail schema generation; retain validation and evaluate reliability/latency before enabling it.

Applied: explicit outreach opt-outs now recognize straight/curly contractions, messaging variants, requests to take/remove a sender off a mailing/email/contact list, and no-more-emails/outreach requests. These suppress before AI or any response in either inbox. Existing suppression persistence, duplicate guards and five-per-day limit remain intact. Pure design discussion about an email list is not suppressed.

Validation: 52 tests passed, including six new regression cases. The deployed Anna inbox module contains the new rules; production main Worker module is byte-for-byte unchanged. Site and client portal 200; unauthorized Anna API/webhook 401. Both auto-send switches read back true. All other modules/assets/bindings preserved. Rollback module snapshot retained privately under ignored .wrangler. No customer messages or extra prospecting were sent by this run.

Operational evidence: three confirmed introductions this morning; no prospect replies observed in that inspection. Savannah's two overnight owner follow-ups received threaded replies. Do not infer success rates or need for larger channels from this small sample.

Sources reviewed October 10, 2026:
- https://www.hostinger.com/support/how-to-use-agentic-mail-in-hostinger/
- https://github.com/hostinger/mail-api/blob/main/openapi.json
- https://developers.cloudflare.com/workers-ai/features/json-mode/ (page updated September 14, 2026)
- https://developers.cloudflare.com/changelog/product/workers-ai/

Remaining: evaluate JSON-mode decisions on synthetic routine, escalation, spam and banter cases before any adoption; improve privacy-safe queue reporting so morning summaries can verify pending/ambiguous state. No new paid provider or model migration applied.

