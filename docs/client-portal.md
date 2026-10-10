# Client projects and sign-in

The client portal is `/client-portal`. The protected studio interface is `/admin/projects`; it uses the existing admin username and password. Private API responses are never cached. Client sessions use a Secure, HttpOnly, SameSite cookie, expire after seven days, and store only a hash of the session token. Project ownership uses provider-specific account IDs; email addresses do not automatically link accounts.

## Use it now with access codes

1. Open https://obsidianreign.gg/admin/projects and sign in with the existing studio admin credentials.
2. Create a project. Keep the generated `invite:` client account ID for code-based access, or use the client's exact social account ID after social login has been enabled.
3. Set scope, milestone, target date, next step and an optional HTTPS review/delivery link. Save.
4. Click **Create access code** for the saved project. Send that code privately to the correct client with https://obsidianreign.gg/client-portal. Nothing is emailed automatically.
5. The code expires after seven days and can be redeemed once. Generating another code replaces the previous unused code for that invited account. The browser session lasts seven days; issue a new code when a client needs to sign in again.
6. Edit the project to post updates. Client feedback appears in the project's timeline. Editing and saving does not delete client feedback.

External review/delivery files must have their own appropriate sharing permissions. The portal does not provide file uploads or make public links private. Changing the project owner removes the previous account's ability to view that project. Social and invited accounts are separate until the studio explicitly changes project ownership after verifying the client.

## Admin quotes and agent review

The admin interface includes private USD quote amounts and quote status, internal studio notes, follow-up dates/actions, a date-sorted follow-up queue, project search, client feedback and studio/agent activity. Quotes and internal planning fields are omitted from every client project response. Dates indicate tasks to review; setting them does not send messages or create recurring jobs.

Authorized project agents use a separate `PORTAL_AGENT_TOKEN` Worker secret. This token can read studio project records and update follow-up dates/notes only. It cannot edit quotes, change ownership, issue access codes, or send email. The local credential lives in `.wrangler/portal-agent-credential.json`, which Git ignores and the public build excludes. Never publish or paste this credential into chat.

From this repository, an authorized agent can run:

```text
node scripts/project-agent.mjs list
node scripts/project-agent.mjs schedule PROJECT_ID YYYY-MM-DD "Follow-up action to review"
```

The script also supports server-side `PORTAL_AGENT_TOKEN` and `PORTAL_AGENT_ORIGIN` environment variables for other trusted runtimes. `GET /api/portal/agent/projects` reviews records; `POST /api/portal/agent/followup` accepts only `id`, `followupDate`, and `followupNote`. Both require Bearer authentication. Every agent change is recorded privately in project activity. No browser script contains the agent credential. To rotate it, replace the encrypted Cloudflare secret and update trusted runtimes; the setup helper intentionally reuses a saved local credential.

Savannah's email agent is not automatically connected to these records, and no recurring follow-up automation is enabled. Separate agent runtimes need the scoped credential configured securely before they can review projects. Human approval/authorization rules still govern any outbound messages.

## Activate social sign-in

Register web applications in the owner's developer accounts. Google, Twitch, and Kick credentials are configured as encrypted Cloudflare secrets, and each provider has passed a real-account sign-in test. Google remains in Testing and needs its remaining branding and production publishing configuration completed before general launch. Buttons appear automatically only when both secrets for that provider exist.

| Provider | Exact authorized redirect URI | Worker secrets | Requested permissions |
| --- | --- | --- | --- |
| Google | `https://obsidianreign.gg/auth/client/google/callback` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `openid profile email` |
| Twitch | `https://obsidianreign.gg/auth/client/twitch/callback` | `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` | Basic user identity; no email, chat or channel management scope |
| Kick | `https://obsidianreign.gg/auth/client/kick/callback` | `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET` | `user:read` |

For Google, create a Web application OAuth client, add the authorized domain `obsidianreign.gg`, configure consent/branding and publish the app (or add explicit test users while testing). For Twitch and Kick, register the website app and exact redirect URI. Configure IDs and secrets using **Cloudflare → Workers & Pages → obsidian-reign → Settings → Variables and Secrets** as encrypted secrets. Do not commit them, put them in HTML, or paste them into chat.

YouTube uses Google account sign-in. Channel linking is not implemented: it would require separate YouTube API consent. Signing in requests identity only, not access to videos, messages or channel controls. Clients can copy their account ID or open a prefilled email to Savannah from the portal to request project assignment; that email is not sent automatically.

Official references: [Google](https://developers.google.com/identity/openid-connect/openid-connect), [Twitch](https://dev.twitch.tv/docs/authentication/register-app/), [Kick](https://docs.kick.com/getting-started/generating-tokens-oauth2-flow).

## Public site improvements

The creator brief has a required-field completion indicator and explicit save/restore/remove draft controls. Drafts stay in this browser's local storage until removed; they are not submitted to the server or synced between devices. Services has expandable FAQs. The navigation links to Client Login on every main page. No sample client data is published.

UX references: [Form progress and clarity](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/), [Visibility of system status](https://www.nngroup.com/articles/visibility-system-status/).
