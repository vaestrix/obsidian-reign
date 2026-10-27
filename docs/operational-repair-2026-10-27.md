# Obsidian Reign operational repair - October 27, 2026

The business is not yet fully launch-ready. This continues the October 26 deployed release without changing the brand or using any Blush Havoc material. The latest merged pull request and its CI checks are the authoritative post-deploy evidence.

## Billing repairs

Milestone advancement now retrieves the invoice and order from Square again rather than relying on a retained deposit flag. Accepted quote, exact total, original customer, location, payment-request terms, USD amounts and a paid deposit remain required. Provider outages revoke the retained deposit confidence and leave the milestone unchanged. Invoiced projects cannot be reassigned to a different client account.

Refund-created and refund-updated events retrieve the authoritative refund and its original payment before associating a project; a refund's separate order is never trusted as the original invoice order. Pending/completed refunds and payment failures put the invoice on an owner-review hold. A later delayed invoice event cannot automatically release that hold. Unknown invoice states and malformed paid amounts also fail closed. Valid review events are acknowledged to avoid pointless retry storms. No refund, payment, invoice or customer is created by these new reconciliation paths.

A refund or payment-failure hold requires owner review. There is no automatic refund, automatic debt forgiveness or silent resumption. Refunded invoice terms are not overwritten; resolve the provider record and agree any replacement scope/invoice before creating a replacement project. Provider subscription coverage and actual sandbox transactions remain unverified.

Local validation: 120 repository tests passed and the integrated-agent deployment guard passed. New cases cover pending refund replays, unrelated merchants/locations, failed payments, unknown states, malformed money, provider outage, stale deposit state and client reassignment. Remote browser and deployment checks are required before publishing this candidate.

## Controlled email test

Two owner-only messages in one thread reached Savannah's mailbox, including a matching In-Reply-To reference. The active webhook's test returned HTTP 202. The observed Cloudflare events showed the explicit test delivery, but the controlled real inbound messages had not produced an observed processing event or owner review receipt during the inspection window. This is an unresolved delivery/processing integration gap, not a passed autonomous-agent test.

The existing webhook remains active with the same endpoint and secret. Its stale description was corrected to review mode. Anna and Savannah auto-send are both false; Vesper and paid Runway generation remain disabled with zero budgets. No prospects or customers were contacted. No ambiguous jobs were replayed.

## Remaining access and production holds

- Google Search Console is signed in as the owner's vaestrix account, but the Obsidian domain property is not verified. Google offers Cloudflare DNS authorization or manual verification. No broad Google DNS access was granted.
- Square again returned 403 for the missing DEVELOPER_APPLICATION_WEBHOOKS_READ scope. A separately configured sandbox and event-coverage check are still required; production payment settings were not changed and no financial transactions were initiated.
- GitHub's browser session is signed out, so the stale guild About description could not be edited there. The connected repository tools can update source but do not expose repository administration.
- Vesper, its trusted Savannah handoff, private delivery storage integration, production output QA and the separate LydiaLuxe/Crimson Fox asset packs remain incomplete. No Blush Havoc files or imagery are used.
- Prior loading-speed limitations and the remaining crawler/security dashboard checks still apply.

## References checked

- https://developer.squareup.com/reference/square/refunds-api/webhooks/refund.created
- https://developer.squareup.com/reference/square/refunds-api/webhooks/refund.updated
- https://developer.squareup.com/reference/square/invoices-api/webhooks/invoice.refunded
- https://developer.squareup.com/docs/invoices-api/pay-refund-invoices


## Manual inbox recovery candidate

The protected studio dashboard now has an owner-only recovery control. It checks at most 100 recent inbox metadata records, queues at most 20 unprocessed messages from the last 24 hours per run and reports truncation or remaining candidates. Existing Message-ID jobs, legacy UID jobs and ambiguous-send tombstones are preserved and skipped. Provider failures report an error; retries skip jobs already queued.

Recovered jobs retain a trusted force-review flag through Message-ID resolution. They can send only the existing owner review notice, even if normal customer auto-reply is later enabled. Public webhook data cannot supply recovery actions or trusted flags. The endpoint requires the existing owner admin session or admin authentication plus same-origin POST; the project agent credential gains no new access. No cron or automatic sender is enabled.

All 128 local tests pass, including review-only processing, replay/unknown-send preservation, bounded history/batches, cross-origin/role protection and UI retry behavior. Remote QA includes a synthetic private-dashboard test at all three viewport sizes, with no external email or payment calls. Live recovery, owner review receipt and the remaining automatic webhook gap still require the owner to sign in to the existing studio admin page and complete the controlled test.


## Search notification follow-up

The payment release deployed successfully and passed 120 repository tests, 15 browser checks, 24 production sitemap URLs, 36 assets and the 25-page accessibility scan. Its final notification step failed because IndexNow returned HTTP 403 (UserForbiddedToAccessSite). Earlier HTTP 202 receipts did not establish ownership acceptance. The public key file is reachable and matches locally; the search provider's validation failure remains unresolved and no indexing success is claimed.

The notification job had a shallow checkout without HEAD's parent, so it submitted even for backend-only changes. The recovery candidate fetches two commits, fails clearly if change inspection is unavailable, ignores private-dashboard/backend-only changes and separates search notification from browser QA. Actual search-provider rejections continue to fail the notification job with a bounded error code; they are not silently converted into success.
