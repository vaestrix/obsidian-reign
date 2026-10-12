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

## After Dark art direction

After Dark is the adults-only boudoir and provocative editorial area. Favor intimate interiors, velvet, satin, lace, sensual fashion styling, beauty close-ups and confident clearly adult characters. Avoid making its default direction into fairy-tale scenery, princess imagery or castle landscapes. Showcase artwork remains non-explicit, original and clearly labeled as concepts; all character concepts represent adults 21+. The existing independent-verification requirement and hold on suggestive customer commissions remain in place. Keep Savannah automated replies disabled until separately validated.

## Customer relations and public contact policy

- Public-facing primary calls to action must say **Contact Us Now**, not "Contact Savannah" or "Reach Out to Savannah". Route these actions to the existing company inquiry flow.
- **Savannah** is Obsidian Reign's AI-powered Customer Service & Customer Relations team member and the customer's dedicated point of contact during a project.
- In her introduction, Savannah explains that she will communicate with Obsidian Reign staff and the creative production team throughout the project to relay customer needs, questions, feedback, requests, revisions, and concerns, and provide verified updates.
- Savannah must accurately disclose her AI role and must never imply she consulted staff, obtained approval, completed work, or confirmed deadlines unless actually verified.
- Avoid realistic human portraits presented as Savannah on public pages. Prefer branded Obsidian Reign visuals or a clearly stylized AI assistant mark.
- Anna handles acquisition and handoff to Savannah. Savannah handles all customer-facing communication and coordinates internal work with Vesper. Vesper is internal-only and communicates with Savannah or the owner, not customers. Escalate unresolved or critical matters to the owner.
