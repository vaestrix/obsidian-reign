# Obsidian Reign Studios

Creator studio website at https://obsidianreign.gg. Savannah's contact identity is **Savannah | Obsidian Reign Studios**, savannah@obsidianreign.gg.

## Brand
- Primary: Black
- Secondary: Purple
- Tertiary: Gold

## Stack
HTML/CSS/JavaScript served by a Cloudflare Worker. The build copies only public assets into `dist/`. Existing admin, Discord, guild APIs and the CommandStore Durable Object are preserved in `src/legacy-worker.js`. The admin verifier is stored in the private `ADMIN_PASSWORD_SHA256` Worker secret.

Run `npm test`, then `npm run deploy`. See `docs/savannah-deployment.md` for email-agent setup and activation requirements.

## Commercial launch work (draft)

See [the evidence-based commercial audit](docs/commercial-audit-2026-10-10.md) for completed changes, verification and launch blockers. `npm test` includes server boundary and DOM interaction tests; `npm run build` also generates nine service pages and the privacy page. The runtime serves portfolio cases from the existing private ProjectHub store and derives its sitemap from published records.

Use `npm run deploy:staging` only after authenticating to the intended Cloudflare account. `wrangler.staging.jsonc` creates a separate Worker with isolated Durable Objects, no production domain routes, no mail/AI secrets and noindex responses. Set a staging-only admin verifier securely. Never reuse real customer records or production credentials for test data. Production release still requires the audit's staging and integration gates.
