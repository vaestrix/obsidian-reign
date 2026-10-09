# Studio project review

When the user asks to review client projects, quotes or follow-ups, use the scoped project API through `node scripts/project-agent.mjs list`. This reads current live records, not local sample data. An empty list means the studio has not created any projects yet.

For user-authorized follow-up scheduling, use `node scripts/project-agent.mjs schedule PROJECT_ID YYYY-MM-DD "Action note"`. This changes only the private follow-up date/action and records agent activity. It does not contact clients. Never claim a message was sent or a recurring automation was created by this command.

The script reads an ignored local credential in `.wrangler/portal-agent-credential.json` or a server-side environment variable. Never print, commit, publish, or paste the token. Do not copy client/internal records to public artifacts. Agent access cannot edit quotes, client ownership or access codes. The studio administers those at `/admin/projects` using the existing admin login.

Read `docs/client-portal.md` for provider setup and operational details. Preserve the read-only `sources/` project references in the parent workspace.
