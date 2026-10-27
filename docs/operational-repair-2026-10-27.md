# Obsidian Reign operational repair - October 27, 2026

The studio is not yet fully launch-ready. This continues the October 26 release without replacing its design or using any Blush Havoc material. The merged pull requests and their exact CI/deployment records supply the final release evidence.

## Billing repair: deployed PR #16

PR #16 merged as 9bd050ea0aee4c16604bc094856cfffe0f9bd29f. Cloudflare reported production version 0e1dbf18-9a52-4f62-85be-4ad9b7804a0f.

Project advancement now retrieves the invoice and order from Square again rather than relying on a retained deposit flag. Accepted quote, exact total, original customer, location, payment-request terms, USD amounts and a paid deposit remain required. Provider outages revoke retained deposit confidence and leave the milestone unchanged. Invoiced projects cannot be reassigned to a different client account.

Refund-created and refund-updated events retrieve the authoritative refund and original payment to associate the project; the refund's separate order is not trusted as the original invoice order. Pending/completed refunds and payment failures put the invoice on an owner-review hold. A delayed invoice event cannot silently release that hold. Unknown invoice states and malformed paid amounts fail closed. Valid review events are acknowledged rather than repeatedly requesting a decision through delivery retries. The new reconciliation paths do not create customers, invoices, refunds or charges.

A refund/payment-failure hold requires owner review. There is no automatic refund, debt forgiveness or resumption. Provider terms are not overwritten; resolve the provider record and agree any replacement scope/invoice before creating a replacement project. Actual sandbox transactions and subscription coverage still require verification.

The exact candidate passed 120 repository tests and 15 desktop/mobile browser checks. Post-merge checks verified 24 production sitemap URLs, 36 assets, private authorization, canonicals and redirects. The 25-page axe scan found no violations in the selected WCAG tags. Production Lighthouse mobile simulated lab: performance 63, accessibility 100, best practices 100, SEO 100. Loading speed remains incomplete. The final notification step failed on a real IndexNow 403, so the entire post-merge workflow was not green.

## Controlled email evidence: automatic inbound review works

Four controlled owner-only messages reached Savannah: two from the connected custom-domain account and two in a Gmail thread from the configured owner account. Exactly one Savannah review notice for each unique test message was found in Sent, and all four notices were confirmed in the configured owner Gmail inbox. No prospects or customers were contacted.

The first sender passed SPF/DKIM but had DMARC none; the existing preflight correctly held both messages for the owner. A later Gmail sender passed SPF, DKIM and DMARC. Savannah generated a routine qualification draft preserving the supplied Twitch platform and cyberpunk style. A follow-up retained the earlier details and the three specified emote expressions. Both drafts reached owner review with transparent AI signatures, without customer auto-replies.

Correction to the initial observation: searching only the separately connected Gmail account missed the notices because escalations go to the owner's other configured Gmail address. There was no demonstrated automatic-webhook failure in this test. The early dashboard view was not evidence of missing processing. Provider tests returned 202, and real inbox-to-owner review delivery was independently verified. No provider replay or live direct customer auto-reply test was performed, so neither is marked complete.

## Private recovery control: PR #17 candidate

The protected dashboard has an owner-only recovery control for future missed deliveries. A run checks at most 100 recent inbox metadata records, queues at most 20 unprocessed messages from the last 24 hours and reports truncation/remaining work. Existing Message-ID jobs, legacy UID jobs and ambiguous-send tombstones are skipped. Provider failures return a clear error; retries skip jobs already queued.

Recovered jobs retain a trusted force-review flag through Message-ID resolution. They can send the existing owner review notice but never automatically reply to a customer, even if the normal sender is later enabled. Public webhooks cannot supply recovery actions or trusted flags. The endpoint requires existing owner admin authentication and same-origin POST. The scoped project agent gains no new access. No cron or automatic sender is enabled. Live recovery requires the owner to sign in to the existing studio admin page.

All 132 local repository tests and the integrated-agent deployment guard pass. The earlier exact recovery candidate passed 129 tests, 18 desktop/mobile browser checks and the 25-page axe scan. The final search-key/robots changes require their own exact remote checks before merge. Private dashboard browser QA uses synthetic owner credentials and a synthetic recovery response; external email/payment requests are blocked.

## Search crawler repair

Cloudflare security events identified the actual Bing ownership-file GET blocked by the managed rule Block AI training crawlers - BOBA-199. The Search preset said Allow, but the Training Block preset also blocked mixed-purpose search crawlers. The OAI-SearchBot preference was already allowed.

Updated content preferences: Search and Agent remain Allow; Training is Disallow with Bot Preference Sync enabled. Then restored targeted blocks for the 16 previously blocked crawlers categorized as AI Crawler, preserving the prior training-only restrictions while permitting Googlebot and Bingbot. Effective UI switches were verified: Googlebot, Bingbot and OAI-SearchBot unblocked; GPTBot and ClaudeBot blocked. The live robots response expresses search=yes, ai-train=no and use=reference and retains the studio sitemap. Browser Integrity Check, managed WAF protections, DDoS protection and application authentication were not disabled. No blanket security bypass was created.

Earlier IndexNow 202 receipts did not prove successful ownership validation. Subsequent submissions returned 403 UserForbiddedToAccessSite. A fresh public ownership key is included to request a new validation after crawler access was repaired; its post-deploy status is recorded in PR #17. Neither notification receipt nor accepted ownership is proof of indexing or ranking.

The old notification job used a shallow checkout without the merge parent's history, so it submitted even on backend-only changes. The new workflow fetches two commits, fails if change inspection is unavailable, ignores backend/private-dashboard-only changes, and separates search notification from browser QA. Actual provider rejections remain visible failures with a bounded error code. Production robots checks now evaluate the intended search groups instead of rejecting legitimate training-bot Disallow groups.

## Remaining holds

- Anna/Savannah customer auto-send remain false. Outreach postal authority and approval are still unverified. Old ambiguous records are not retried.
- Google Search Console is signed in as the owner but the Obsidian domain property is not verified. No broad Google DNS access was granted. Bing Webmaster verification remains incomplete.
- Square subscription inspection still returns 403 for missing DEVELOPER_APPLICATION_WEBHOOKS_READ. Separate sandbox payments, failures/refunds, duplicate events and invoice/receipt review remain incomplete. No financial transactions or real customer invoices were initiated.
- The GitHub browser is signed out, so its stale guild About description remains. The source connector does not expose repository administration.
- Vesper has no deployed production implementation. Trusted project handoff, private delivery storage, generation budget, output QA and the separate LydiaLuxe/Crimson Fox production kits remain incomplete. Vesper/paid Runway generation remain disabled with zero budgets.
- Loading speed and a complete manual accessibility review remain open. Automated checks do not certify full accessibility or business readiness.

## References checked

- https://developer.squareup.com/reference/square/refunds-api/webhooks/refund.created
- https://developer.squareup.com/reference/square/refunds-api/webhooks/refund.updated
- https://developer.squareup.com/reference/square/invoices-api/webhooks/invoice.refunded
- https://developer.squareup.com/docs/invoices-api/pay-refund-invoices
- https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/
- https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/
- https://developers.cloudflare.com/ai-crawl-control/configuration/ai-crawl-control-with-waf/


## Final robots compatibility follow-up

PR #17 deployed Cloudflare production version 47ddb0d0-690f-4b18-b12c-78f507eb33b1. Its post-merge workflow passed 132 repository tests, 18 desktop/mobile checks, 24 production sitemap URLs, 36 assets and the 25-page axe scan. A direct production check confirmed that the recovery endpoint rejects unauthenticated requests with 401 and that its module is deployed.

The fresh IndexNow submission returned 202, followed by HTTP 200 at 05:50:56 UTC on October 27, confirming notification/ownership acceptance. Indexing and rankings are still not confirmed.

The managed Content-Signal extension made the pinned Lighthouse robots audit fail and reduced its SEO score to 92, despite the intended search access being allowed. The compatibility follow-up uses standard User-agent/Disallow training restrictions in the repository and turns off only Bot Preference Sync. The separate targeted edge blocks for the 16 training-category crawlers remain enabled, as do WAF, DDoS and authentication. Search/Agent stay allowed and the global training policy remains Disallow rather than the mixed-purpose Block option. This avoids restoring the Bing/Google block.

Local verification for this follow-up: 133 repository tests and deployment guard pass. Its exact candidate and post-deploy evidence are recorded in PR #18. Google ownership TXT verification is prepared but not submitted; it would grant the signed-in owner account Search Console ownership and awaits explicit confirmation.
