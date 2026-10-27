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
