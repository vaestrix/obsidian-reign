# Savannah activation — 27 October 2026

The owner authorized enabling routine automated replies and fixed holding acknowledgements after testing. Refunds, cancellations and serious complaints remain escalated to Philip for a decision. Holding replies acknowledge receipt and review only; they cannot approve outcomes, change project/payment records or promise deadlines.

## Verification

All 163 repository tests passed before activation. A paused, authenticated owner-only Gmail message produced the expected review draft before enabling sending. Strict sender authentication remained enforced: separate owner-domain messages without passing DMARC were held rather than bypassed.

Production Worker version: 4dd1fb76-8d12-4016-aed8-e50588ef37bc. Production read-back confirmed SAVANNAH_AUTO_SEND=true and ANNA_AUTO_SEND=false. Required secrets and bindings were present and preserved. The Hostinger inbound webhook remains active.

Four fictional messages were sent solely from the owner's Gmail account to Savannah after activation:

| Case | Inbox UID | Customer reply Sent UID | Owner review Sent UID |
| --- | --- | --- | --- |
| Routine emote enquiry | 18 | 21 | Not required |
| Refund | 19 | 20 | 19 |
| Cancellation | 20 | 23 | 22 |
| Serious complaint | 21 | 25 | 24 |

Exactly one threaded customer reply was verified for each test, with three separate owner review notices for the sensitive cases. Delivery was also checked in the owner's Gmail conversations. No real customer test recipient, historical replay, refund, cancellation or project change was used.

Authentication checks, conservative exclusions, owner-first notification and duplicate prevention remain enabled. Ambiguous sends are not retried automatically. Local authenticated Anna status could not be checked because its scoped credential is unavailable; Anna's paused runtime flag was independently verified.

## Deployment preservation

Production configuration omits the owner-managed SAVANNAH_AUTO_SEND switch and retains keep_vars=true so future deployments preserve the live choice. The deployment guard enforces that omission. Preview sending remains explicitly disabled. Missing runtime switches fail closed in the agent.
