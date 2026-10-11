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

## Continued October 10 — private operational reporting

Added scoped GET /api/anna/status and scripts/anna-status.mjs with aggregate-only durable-state counts. Pagination regression tests cover more than 1,000 stored records and prevent contact/content leakage. 53 combined tests pass. Live verified: outreach sent=4, no other outreach states; inbox escalation-pending=4, escalated=1, replied=4. These are retained/current states and include setup jobs; they are not customer/day totals. Both switches true; site/portal 200 and unauthorized status 401. No messages sent by this update. Production modules/assets/bindings preserved; rollback retained privately. Pending escalation notices remain flagged for source-aware investigation, not blindly retried.

October 11 morning check found production agent routes absent, Anna mailbox/switch missing and Savannah switch false following a later site build. Restored authenticated routes around the current application wrapper, tested inbox module and previously approved text bindings without replacing application code or assets. Both registered webhooks remain active; full October 10 mail pagination shows three prospect sends, no prospect replies, two owner-test responses. Aggregate retained queues show no pending/unknown outreach, four pending setup escalation notices. No ambiguous sends replayed and no test/customer mail sent. Temporary inspection removed. Next site deployment must preserve src/worker.js agent entry point and Wrangler vars; source remains correct, production rollback snapshot retained privately.

## October 11 daily review — deployment guard

Official Cloudflare Wrangler configuration confirms keep_vars preserves dashboard variables across deployments. Enabled keep_vars in the integrated repository configuration, added scripts/check-agent-deployment.mjs and wired it into the standard deploy command. Guard checks the integrated entry point, agent route presence, shared inbox binding and required configuration. Added repository instructions requiring preservation of live agent integrations and explicit owner pauses. Guard passes locally. These are deployment-workflow changes, not a replacement production deployment. A helper or alternate checkout that bypasses this workflow is not protected; post-deploy status checks remain required.

Live read-only status: both agents enabled, five outreach records sent, no queued or uncertain outreach states. Four retained escalation notices remain pending; they are not automatically retried because outcome is ambiguous. No new model or provider adopted, no extra email sent. Current sources reviewed October 11: https://developers.cloudflare.com/workers/wrangler/configuration/ ; https://developers.cloudflare.com/changelog/product/workers-ai/ ; https://www.hostinger.com/support/how-to-use-agentic-mail-in-hostinger/ . No relevant provider change required a production model migration.

