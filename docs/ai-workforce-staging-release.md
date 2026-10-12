# AI Workforce staging release runbook

## Current gate
GitHub CI and Wrangler dry-run do **not** prove that the private Cloudflare R2 bucket exists or that authenticated downloads work against a deployed Worker. Never mark the release ready based only on dry-run success.

## Cloudflare setup (requires authorized account access)
1. Confirm the intended Cloudflare account and create a private R2 bucket named `obsidian-reign-delivery-staging`. Disable public development URL and custom public domains.
2. Verify the staging Worker uses only `wrangler.staging.jsonc` and its `DELIVERY_BUCKET` binding targets this bucket. Never bind production customer storage to staging.
3. Configure GitHub environment `obsidian-reign-staging` with required reviewer protection and staging-only `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` secrets, plus `STAGING_URL` environment variable. Token scope must be limited to the intended account and necessary Worker/R2 operations.
4. Confirm that the staging Worker has no production mail, payment, or generation secrets. `SAVANNAH_AUTO_SEND=false` is required.
5. Review and manually dispatch `Deploy Isolated Staging (Manual Only)` with confirmation `DEPLOY-STAGING-ONLY` only after the workflow is available in the repository's Actions UI. This workflow must never be enabled on push or pull requests.

## Synthetic integration acceptance
- Unauthenticated project, review, file listing, file download, refresh and agent-task endpoints deny access.
- A synthetic owner can approve the latest preview and download the exact verified R2 file.
- A second synthetic user cannot access the first user's project.
- A new unapproved preview invalidates older approval.
- Changed/missing R2 files, wrong content types, ETag mismatch, duplicate keys and stale verification fail closed.
- Expired verification can be renewed only after same-origin authenticated POST and unchanged R2 snapshot.
- Confirm actual file contents and security scanning, not just R2 metadata.
- Verify customer UI on mobile and desktop, with browser network inspection for private key leaks.
- Confirm no customer emails, real payments, or Runway jobs were triggered.

## Release decision
Keep PR #4 in draft and production unchanged until the tests above are evidenced, reviewed, and owner-approved. Record results in issue #5.
