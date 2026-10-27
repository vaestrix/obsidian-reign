# Savannah holding acknowledgements

Published 27 October 2026, Worker version 100a7d9d-9ae0-4e7b-a3c2-dd780f0978dc.

## Behavior

Refund requests, cancellations (including indirect requests to stop a project), and serious complaints retain owner escalation. Eligible cases additionally receive a fixed, neutral acknowledgement draft. It confirms receipt and handoff only: it cannot approve a refund or cancellation, authorize revisions, stop project work, promise a deadline, decide payment terms, or alter project/payment records.

The acknowledgement is included in Philip's existing review notice. A customer acknowledgement can be sent only after the owner notice is accepted, when SAVANNAH_AUTO_SEND is true, forceReview is false, the automation start gate permits processing, and the original sender/authentication/recipient and thread checks pass. Anna-origin messages use Anna mailbox credentials with Savannah's established response identity.

Production read-back confirmed ANNA_AUTO_SEND=false and SAVANNAH_AUTO_SEND=false. Those controls were preserved, so customer acknowledgements currently remain drafts in review notices. No real customer email was sent during this work.

## Safety and duplicate handling

Legal/security/credential/verification issues, suspicious links or instructions, opt-outs, failed authentication, mismatched reply addresses, CCs, attachments and generic policy questions are not eligible for these fixed customer acknowledgements. Existing escalation/ignore behavior remains. A missing or already-answered thread prevents acknowledgement.

Before attempting a customer send, one transaction reserves holding:<Message-ID> and the existing message identity marker. The marker records sent or send-outcome-unknown. Ambiguous sends are never retried automatically, including on a duplicate delivery; inspect Sent before any manual recovery. The request remains escalated regardless of acknowledgement success. Owner-notice failure prevents the customer acknowledgement. Acknowledgements do not count as resolving the customer's request.

## Wording

Refund: Hi! Thanks for reaching out. I've passed your refund request to Philip so he can review the project details and next steps. I don't have a decision to confirm yet.

Cancellation: Hi! Thanks for letting us know. I've passed your cancellation request to Philip for review. He'll need to check the project details before confirming any changes.

Complaint: Hi! I'm sorry to hear you're unhappy with the experience. I've passed your concerns to Philip for a closer review. He'll need to check what's happened before confirming next steps.

The model instruction for routine design feedback now says Let's review that direction rather than Let's adjust that. It explicitly avoids approving revisions or extra work before scope/cost confirmation. A configured-model fictional retest used that wording; refund, cancellation, serious dissatisfaction and indirect cancellation remained held for owner review.

## Verification

All 163 repository tests passed. Mocked paths cover owner-first notification, one acknowledgement, preserved review/force-review controls, exclusions, already-answered threads, ambiguous-send deduplication and Anna mailbox routing. Fresh production read-back verified the helper functions, notice formatter, escalation method, acknowledgement method and tone rule against the tested source using syntax-tree comparison. Deployment changed only those reviewed ranges in the current live Worker and preserved bindings, runtime variables and unrelated backend code.

Authenticated Anna status remains unavailable because the checkout lacks its scoped credential. This is not an end-to-end live email delivery certification.
