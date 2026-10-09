# Obsidian Reign Studios

Creator studio website at https://obsidianreign.gg. Savannah's contact identity is **Savannah | Obsidian Reign Studios**, savannah@obsidianreign.gg.

## Brand
- Primary: Black
- Secondary: Purple
- Tertiary: Gold

## Stack
HTML/CSS/JavaScript served by a Cloudflare Worker. The build copies only public assets into `dist/`. Existing admin, Discord, guild APIs and the CommandStore Durable Object are preserved in `src/legacy-worker.js`. The admin verifier is stored in the private `ADMIN_PASSWORD_SHA256` Worker secret.

Run `npm test`, then `npm run deploy`. See `docs/savannah-deployment.md` for email-agent setup and activation requirements.
