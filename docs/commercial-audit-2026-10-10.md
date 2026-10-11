# Obsidian Reign commercial audit — October 10, 2026

**Release status: draft implementation; not deployed and not certified production-ready.**

Repository inspected: `vaestrix/obsidian-reign`, baseline `9858f93`. Production inspected: https://obsidianreign.gg/. This is a prioritized production audit and first implementation tranche, not a claim that all twelve directive phases are complete. No live prices, customer records, payment settings or deployed Worker were changed.

## Evidence and access limits

- Read the actual Worker entry point, preserved legacy Worker, ProjectHub storage and client/admin routes, Savannah inbox processor, public HTML, browser scripts, build script, deployment configuration, and existing tests.
- Production browser: loaded homepage and inquiry page, selected a calculator product and followed its project CTA. The destination lost that selection. Loaded client portal and observed Google, Twitch, Kick and invitation-code options after its provider request completed. No provider login, private project access, customer submission or email was performed.
- Live page describes Savannah as owner and creative director, whereas the requested implementation identifies her as AI. Live portfolio source is an illustration plus three direction descriptions; richer demo videos exist elsewhere.
- Baseline automated tests: **25 passed**. They cover portal ownership, one-use invitations, OAuth state/PKCE, preview decisions, webhook authentication, reply safeguards and escalation behavior using synthetic fixtures. They do not prove production integrations work.
- Cloudflare CLI reports **not authenticated**. No deployment variables were present; scoped project-agent command reports credentials are not configured. Live Durable Object records, current secret presence, Cloudflare logs, payment account, delivered mail, and production error rates are **unverified**.
- Direct HTTP checks from the terminal returned 403 for every sampled route, including the homepage that loaded in the browser. These are an access-path limitation, not evidence that production routes are broken. They are excluded from application defect counts.
- Search retrieval still surfaced a Nox Reign guild homepage and guild routes. The current repository has studio content and old-route HTML refresh stubs. This supports a stale discovery/migration problem; it does not identify Google's selected canonical or guarantee the cause. Search Console inspection failed because GSC Wizard reported an expired trial/no active subscription. No sitemap submission or indexing request was made.
- Local Cloudflare runtime suites both failed to start with `uv_interface_addresses returned Unknown system error 1`. No endpoint assertions in those suites ran. Dry-run bundling succeeds. Desktop screenshot of the live inquiry page was inspected; tablet/mobile screenshots, keyboard completion across all pages, media playback quality, real accessibility audit and field Core Web Vitals remain unverified.

## Prioritized findings

| Priority | Finding and evidence | Business impact | Current branch / next action |
| --- | --- | --- | --- |
| P0 | Inquiry and free-audit forms generate mailto links, not server records (`studio.js`) | A visitor can finish the form without the studio receiving anything | Implemented private durable capture, consent acknowledgement, retry identifiers, receipt reference and owner queue. Confirmation email remains pending. |
| P0 | No checkout, invoice/deposit webhook or payment ledger implementation found in this repository | Online purchase and reliable collected-revenue metrics are not established | Block commercial launch approval until a verified merchant integration and test-mode payment/refund/webhook journeys are complete. No fake payment UI added. |
| P0 | Runtime, private production configuration and database access unavailable | Cannot validate migrations, live auth, live mail or deployment compatibility end to end | Isolated staging config prepared; authenticate Cloudflare securely and deploy/test staging before release. |
| P1 | Calculator selection is lost on inquiry navigation; overlapping add-ons can double-count | Scope confusion and abandoned inquiries | Fixed handoff using known product IDs; deduplicated identical items; amounts remain estimates, never invoice authority. |
| P1 | Portfolio does not present the site's available motion work as case studies | Weak evidence of capability | Four explicitly labeled internal concepts; reusable case-study rendering and admin publishing from already-public assets. No clients/results invented. |
| P1 | Major services share a single broad page | Visitors cannot evaluate a specific service's scope and process | Added nine distinct landing pages with existing prices or quote methods, scoped deliverables, policies, FAQs and inquiry links. |
| P1 | Savannah presented as human owner/creative director | Misleading identity and authority | Corrected visible homepage identity; strengthened inbox persona and privacy disclosure. Existing spoken media still requires content review. |
| P1 | No customer-visible proposal/acceptance/deposit workflow | Quotes are private admin notes, not an online purchase journey | Preserve existing quotes. Next: versioned proposals, client-visible scope and acceptance, then payment state driven by verified provider events. |
| P1 | Email-agent deployment document says four secrets absent and review mode; current deployment not inspected | Automated response/escalation cannot be claimed operational | Preserved review mode. Verify current secrets and actual Hostinger webhook contract, replay behavior and controlled email delivery. |
| P1 | Most public pages lack complete canonical/share metadata; old paths use HTML refresh | Rebrand signals and sharing are inconsistent | HTTP 301 migration map, canonical clean URLs, OG image, Organization/Service schema and dynamic sitemap. Verify live crawl after deployment. |
| P1 | Browser code automatically plays visible videos; source assets total about 127 MiB | Avoidable media/network/CPU pressure | On-demand playback, preload none, pause offscreen/hidden videos and remove pointer-particle churn. No measured CWV improvement claimed. |
| P1 | Portfolio needs publishing permissions and injection boundaries | Private media could otherwise leak through a public showcase | Admin-only edits, rights acknowledgement, local public asset path/type validation, file-existence check, escaping, conflict control and publish audit records. Secure uploads remain pending. |
| P2 | Admin authentication probes loaded full guild state | Unnecessary database read and coupling | Reuse existing verifier directly; preserve password and session semantics. Failed legacy Basic-auth requests are rate-limited. |
| P2 | Route decoding errors and inconsistent security headers | Error reliability and defense-in-depth gap | Malformed URL response, no-store/noindex for private routes, framing/object restrictions and safe top-level errors. Not a complete security certification. |
| P2 | No measured acquisition/funnel analytics or experimentation platform | Cannot attribute leads or claim conversion gains | Owner counts are from saved records. Collected revenue reads “Not connected.” Event/consent plan below; no abandonment tracking enabled. |
| P2 | Unlimited retention and unbounded project listing/history assumptions | Privacy and scale risk | Disclosed existing retention honestly; new inquiry listing capped at 200 and marks incomplete counts. Indexed pagination, policy-driven retention and immutable audit retention remain required. |

## Existing functionality preserved

- Google/Twitch/Kick identity routes, PKCE for configured providers, account isolation, Secure/HttpOnly sessions and explicit project assignment.
- Single-use access codes, versioned previews, latest-version approval/change requests, milestones, client feedback and separate internal notes.
- Admin password verifier, limited project-agent permissions and private follow-up scheduling.
- Savannah webhook verification, replay suppression, mail-thread reconstruction, owner escalation rules and fail-closed review mode.
- Legacy guild/Discord APIs and Durable Object classes/migration tags. Old public page destinations use the migration map already implied by their stubs; records are not deleted.
- Current published prices. No custom quote, discount, refund or financial commitment was issued.

## Implemented routes and data boundaries

| Surface | Behavior | Access |
| --- | --- | --- |
| `POST /api/studio/inquiries` | Validated brief/audit capture; origin check; bounded streaming body; hashed rate-limit key; idempotent retry; no personal data in response | Public submission, explicit privacy acknowledgement |
| `/api/portal/admin/inquiries` | Read inquiry queue and update pipeline stage/private notes; rejects stale updates | Existing studio admin authentication only |
| `/api/portal/admin/portfolio` | Edit/publish/hide verified showcase fields using existing public media | Studio admin only; requires publishing-rights confirmation |
| `/portfolio`, `/work/:slug` | Escaped server-rendered case studies and available media | Published public fields only |
| `/services/:slug` | Nine built pages from reusable service templates | Public |
| `/privacy` | Inquiry, client-session, draft, AI and retention disclosure | Public |
| `/sitemap.xml` | Canonical marketing/service pages plus currently published work | Public; excludes admin/client/API routes |

New records reuse ProjectHub prefixes (`lead:`, `lead-request:`, `portfolio:`, `portfolio-audit:`). There is no destructive schema migration or new binding in production. Inquiry and portfolio changes do not grant project ownership, send email, create quotes or take payments. Portfolio uploads are **not** implemented; editing accepts already-public local assets only. Existing project-agent access does not include the new inquiry queue.

The new lead dashboard is an initial owner workflow, not a complete CRM. Counts of quotes reflect manually saved statuses; they are not independently verified acceptance events. No payment, CAC, conversion or capacity values are fabricated.

## Service pages

- `/services/cinematic-streaming`
- `/services/animated-alerts`
- `/services/channel-branding`
- `/services/overlays-transitions`
- `/services/cinematic-trailers`
- `/services/creator-websites`
- `/services/music-voice`
- `/services/emotes-artwork`
- `/services/monthly-content`

Motion concepts are labeled as internal work. The audio page explicitly states that the current preview is silent visual material. Monthly editing retains the published 12-clip / 2-hour source-footage / one-revision-per-batch scope. Where standalone deadlines, revisions or license rights are not established, the page says they must be agreed before payment instead of inventing terms.

## Pricing and capacity review

The owner dashboard includes an internal model with production hours, revision hours, hourly cost, rendering/generation cost, software allocation, complexity and urgency multipliers, fee percentage/fixed fee, and target margin. It cannot alter public prices.

`production cost = (hours + revision hours) × hourly cost × complexity × urgency + generation + software allocation`

`target price = (production cost + fixed transaction fee) / (1 − fee fraction − target margin fraction)`

Real profitability cannot be determined without time logs, subscription allocations and actual processor terms. The following is a **sensitivity example only**, assuming $50/hour loaded labor cost, a 40% contribution-margin target, and illustrative fees of 3% + $0.30. These are not claimed account rates or measured production costs.

| Published package | Assumed nonlabor cost | Maximum total labor at that target |
| --- | ---: | ---: |
| $299 Reign Starter | $30 | 2.80 hours |
| $649 Creator Ascension | $60 | 6.19 hours |
| $1,299 Cinematic Reign | $120 | 12.40 hours |
| $2,499 Creator Dominion starting scope | $200 | 24.48 hours |
| $499 Monthly Clip Editing | $40 | 4.88 hours/month |

The $299 package's multiple scenes, alerts and two revision rounds are especially sensitive to rework. The $649 package combines animation, alerts, emotes and branding; it needs measured production time before aggressive promotion. The $1,299 package needs defined shot/scene lengths, character complexity and audio rights. The $499 monthly plan can miss the illustrative target if two hours of footage review plus twelve edits and revisions exceed 4.88 hours.

Recommended owner decisions, **not published changes**:

1. Define asset counts, scene duration, resolutions/aspect ratios and motion complexity in the signed scope.
2. Define a revision round as one consolidated feedback batch on the approved direction. Quote new concepts separately.
3. Log hands-on hours and generation spend on the first jobs before setting production capacity or raising prices.
4. Pilot recurring clips within the existing limits. Offer seasonal updates or website maintenance only with explicit workload, response windows, exclusions, renewal and cancellation terms.
5. Measure contribution after costs, not simply gross revenue. $5,000–$20,000 monthly is a goal requiring demand, sales and production capacity, not a website outcome or guarantee.

## Remaining backlog and release gates

### Next tranche: close the sale safely

- Verify a connected merchant account belongs to the studio; build and test quotes → acceptance → deposit → milestone billing. Store quote snapshots and provider identifiers server-side. Verify webhook signatures and replay/idempotency before marking anything paid.
- Make proposals visible only to their assigned client, distinguish owner draft from sent quote, record explicit acceptance and revision history.
- Implement secure reference/delivery uploads with private storage, size/type limits, authorization checks, malware-handling policy and expiring access. Current external file links retain their provider permissions.
- Add controlled confirmation/owner notification email with real delivery tests and an owner-visible failed-delivery queue. The new form honestly confirms storage, not email delivery.
- Test Google production consent configuration; repository docs say it remains in testing. Do not infer readiness from a visible provider button.

### Savannah and owner operations

- Verify the live inbox integration and approved facts; run controlled routine, refund, prompt-injection and uncertain-send cases. Do not activate auto-send merely because unit tests pass.
- Web chat is not currently implemented in the inspected baseline or this tranche. Add an explicitly disclosed AI concierge with bounded spending, session ownership, transcript retention, service-source grounding and owner escalation after the integration contract is approved/tested.
- Expand single-owner administration to individual staff roles, immutable audit records, lead-to-project linking, operational capacity and notifications. Current roles are studio admin, client and scoped agent, not a granular staff RBAC system.
- Implement paginated/indexed project retrieval; current client lookup lists all projects in the Durable Object before filtering. Preserve ownership enforcement while removing that scale bottleneck.
- Adopt a retention policy and deletion workflow; avoid promises of automatic deletion that the implementation does not perform.

### Analytics and experimentation specification (not active)

| Event | Trusted trigger | Permitted measurement |
| --- | --- | --- |
| `service_view` | Public service page loaded after analytics consent | Service slug and coarse referral category |
| `portfolio_play` | Visitor starts media after consent | Public project slug |
| `estimator_use` | Known product selection after consent | Product IDs; no brief text |
| `inquiry_received` | Successful durable submission | Count by service; never expose email/body |
| `quote_sent` / `quote_accepted` | Future versioned quote transition | Quote ID internal; aggregate externally |
| `deposit_paid` / `payment_completed` | Verified payment webhook | Currency/amount/provider event ID internally |
| `owner_escalation` | Persisted escalation record | Aggregate reason category |

Do not log raw form contents, email, private reference URLs or chat messages to analytics. Abandonment metrics require an explicit consent design and denominator; an unsubmitted form is not a lost customer. CAC is unavailable until attributable marketing spend and customers can be joined lawfully. A/B tests need stable consented assignment, documented success metrics and sufficient samples; no lift is claimed.

### QA before production

- Deploy `wrangler.staging.jsonc` with separate synthetic records and staging-only admin credentials. It has a separate Worker name/storage namespace, no production routes, no AI/mail credentials and noindex headers. Do not copy production secrets or records into it.
- Confirm staging hostname/origin and use only staging callback URLs if testing OAuth. Keep public production URLs in canonical metadata.
- Run public inquiry → owner queue → qualification; project → invitation → client feedback/review → logout; portfolio publish/hide → public page/sitemap, including unauthorized second-client requests.
- Run desktop/tablet/mobile and keyboard QA; check focus, contrast, long labels, media controls, no-JS behavior and reduced-motion. New surfaces have responsive CSS, but screenshot testing is not yet complete.
- Run isolated Cloudflare runtime suites on a supported host. Unit/DOM mocks are not substitutes for Durable Object runtime behavior.
- Complete test-mode payment and controlled mail tests when connected; review logs without exporting private records.
- Measure field CWV where available and lab media/network behavior. No Lighthouse score or production performance improvement is claimed.
- Only then merge/deploy the reviewed production commit. Keep an existing Worker version available for rollback; do not delete new records or migrations to roll back UI.

## Verification recorded for this tranche

- 39 Node tests passed: original 25 plus 10 commercial boundary tests and 4 DOM interaction tests.
- Production public build passed; production and isolated staging deployment dry-runs passed.
- Static crawl of 19 built HTML pages checked 406 local references: zero missing targets or anchors.
- JavaScript syntax and `git diff --check` passed.
- Cloudflare runtime suites: blocked before startup (environment error above).
- Authenticated production journeys, payment sandbox, mail delivery, live DB/log review, deployed preview, mobile/tablet visual checks, accessibility conformance and CWV: **not completed**.
