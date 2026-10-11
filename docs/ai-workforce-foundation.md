# AI Workforce Foundation (Draft)

Status: design specification only. No live agent autonomy or production deployment is authorized by this document.

## Roles and boundaries
- Anna: prospect discovery, qualification, approved outreach, structured handoff to Savannah.
- Savannah: sole customer-facing owner of post-handoff communication, quotes, approvals, project updates and delivery. Preserve existing Savannah identity and email integration.
- Vesper: internal-only creative producer for emotes, alerts, overlays, video and other commissioned assets. May communicate **only with Savannah and the owner**. No customer email/chat endpoints, no public Vesper API, no customer-facing identity. Customer proofs and revisions pass through Savannah.
- Atlas: internal COO, coordinates tasks and makes recommendations. Cannot override owner decisions or communicate as Vesper.
- Forge: code, testing, infrastructure and draft pull requests; no unapproved production deploy.
- Mercury: financial analysis and cost monitoring; no payments, refunds, banking changes or price policy updates without authorization.
- Sentinel: security, privacy, quality and incident reporting; destructive actions require owner approval.
- Nova: product research and feature proposals; no unilateral product or pricing launches.

## Required task lifecycle
lead_discovered -> qualified -> handed_to_savannah -> brief_confirmed -> quote_approved -> paid_or_authorized -> production_queued -> preview_ready -> customer_review_via_savannah -> revision_or_approval -> quality_verified -> delivered_by_savannah -> closed.

Record every transition with actor, timestamp, customer/project identifiers, previous/new state, supporting evidence and idempotency key. Never interpret an agent's generated text as authorization to spend, refund, publish, or deploy.

## Access-control invariants
1. Enforce permissions server-side, not in prompts. Customers cannot call Vesper routes or subscribe to Vesper messages.
2. Vesper can emit messages addressed only to Savannah or owner. Internal job events are machine-readable task records, not conversations with other agents.
3. Only Savannah can release Vesper outputs to customers, after required approval gates.
4. Owner can inspect and override all workflows; preserve immutable audit records.
5. Agent tools use scoped credentials; redact sensitive data and prevent prompt-injection from research, customer messages and uploaded assets.
6. Keep SAVANNAH_AUTO_SEND=false until explicitly reviewed and approved. No bulk outreach without policy/rate-limit controls.

## Infrastructure plan
- Reuse existing Cloudflare Worker, SAVANNAH_INBOX, PROJECT_HUB, COMMAND_STORE and AI binding where appropriate.
- Evaluate D1 for indexed reporting, R2 for customer assets, Queues/Workflows for durable production orchestration, and Cron for scheduled research. Provision only after schema and cost review.
- Use existing business mailboxes through scoped authorized integration; Vesper receives no mailbox.
- Integrate RunwayML only after confirming API capabilities, access and costs. Do not assume image/video output is production-ready: verify transparency, format, dimensions, audio and rights.
- GitHub feature branches, tests, code review, staging, owner-approved production release and rollback plan.

## Research and continuous improvement
- Each role maintains sourced research notes with dates, confidence, relevance and expiration/recheck dates.
- Separate proposed learnings from approved operating rules; require evaluation before promotion.
- Measure qualified leads, conversions, customer satisfaction, revision cycles, generation costs, delivery time, QA failures and incidents.
- Weekly performance reviews; scheduled research only when enabled, with budgets and source verification.

## Build sequence
1. Audit existing Savannah/ProjectHub contracts, auth, emails, worker routes, test coverage and staging environment.
2. Implement policy tests proving Vesper cannot reach customers or public channels.
3. Define typed agent registry, internal event envelopes, approval and escalation states.
4. Add persistent task queue, owner dashboard and notifications with safe defaults.
5. Implement Anna -> Savannah handoff and Savannah <-> Vesper production pipeline.
6. Integrate generation tools and finance/security monitoring behind per-job spending limits.
7. Staging integration tests, owner review, then explicitly authorized deployment.
