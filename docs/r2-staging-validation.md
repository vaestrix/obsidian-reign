# Private delivery storage staging checklist

Do not attach production customer files or production R2 buckets to staging.

1. In the intended Cloudflare account, create a **private** R2 bucket dedicated to staging, e.g. `obsidian-reign-delivery-staging`. Keep public access and custom public domains disabled.
2. Add a staging-only R2 binding named `DELIVERY_BUCKET` to `wrangler.staging.jsonc`, pointing at that bucket. Do not modify the production Worker binding yet.
3. Deploy staging only after reviewing account, environment, secrets, and existing isolated Durable Object configuration.
4. Create synthetic test projects and users, never real customer data. Upload a synthetic PNG under `deliveries/<projectId>/<approvedVersionId>/<fileName>` with correct contentType and size.
5. Validate authenticated ownership, current-version approval, owner delivery authorization, manifest, and successful private download.
6. Confirm a different signed-in user, unauthenticated request, stale version, missing file, MIME mismatch, and wrong project all fail closed.
7. Confirm response headers include private/no-store, nosniff and attachment disposition. Check no R2 storage keys are leaked in customer metadata.
8. Audit R2 object permissions, content inspection, safe filename handling, upload provenance and malware scanning before production activation.
9. Do not enable auto-send, automated paid generation, or production deployment based solely on these checks.

Known limitations: The existing file stream verifies R2 metadata but not malware, content correctness, or quality; verification is not persisted as a separate release gate. The staging bucket must be provisioned and verified manually or through an explicitly authorized Cloudflare integration.
