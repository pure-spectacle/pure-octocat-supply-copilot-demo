# Copilot Code Reviewer — Review Guidance and Output Format

Purpose
- Provide a consistent checklist for code reviews across this repo (TypeScript/Node API + React frontend).
- Focus on correctness, security, and maintainability with fast, actionable feedback.

Scope
- Apply to all pull requests in this repository.
- Technologies: Node/Express, TypeScript, Vite/React, Vitest, Docker/Dev Containers.

Reviewer checklist (hit each section briefly; flag only what matters)
1) Correctness & design
- Does the change meet the stated requirement? Are edge cases covered?
- Are interfaces/types accurate and narrow? Avoid any unless justified.
- Keep functions/modules cohesive; avoid duplication (DRY) and long functions.

2) API (Express) quality
- Status codes are appropriate (201 on create, 204 on delete, 400/404/409/422 for expected errors).
- Input validation present for all inbound data (query/body/params). Recommend zod, yup, or express-validator.
- Consistent error handling and JSON error shape; no unhandled promise rejections.
- CORS, timeouts, and rate limiting considered for public endpoints as applicable.
- OpenAPI/Swagger updated when API surface changes (`api/api-swagger.json`).

3) Security (OWASP top issues; Node/React specifics)
- No secrets or tokens in code/logs. Environment variables are used and not leaked to the client.
- Injection risks (SQL/NoSQL/command/path/prototype) mitigated; never pass unsanitized input to fs, child_process, eval, or template engines.
- XSS: never render untrusted HTML; avoid dangerouslySetInnerHTML; escape user content; sanitize URLs.
- CSRF: ensure state-changing endpoints require proper auth; use same-site cookies or CSRF tokens if relevant.
- SSRF: validate outbound URLs; restrict protocols/hosts as needed.
- Dependencies: pinned versions; check for known vulns; prefer maintained packages.

4) Frontend quality (React/Vite)
- State is localized; components are small and testable.
- Avoid unnecessary re-renders; memoize when needed; keys are stable for lists.
- API calls centralized; errors surfaced to users with accessible UI.
- Build impact: unnecessary large deps avoided; images optimized; code-splitting considered for large routes.

5) Testing
- Unit/integration tests added or updated for new behavior (Vitest + Supertest for API routes).
- Happy path + at least one error/edge path.
- Tests do not depend on network/ports (use in-memory Express app per `branch.test.ts` pattern).
- Keep tests isolated; reset in-memory state between tests.

6) Observability & ops
- Meaningful log messages (no secrets), consistent structure, actionable context.
- Useful errors surfaced with correlation/trace IDs when available.
- Docker/devcontainer changes don’t break local dev (ports, commands, memory/CPU requirements).

7) Performance & reliability
- Avoid N+1 patterns and repeated I/O in hot paths; batch where reasonable.
- Timeouts/retries where appropriate for outbound calls.
- Avoid synchronous blocking operations on the request path.

Finding severity levels
- Critical: exploitable vulnerability, data loss/corruption, build/test blockers.
- High: security hardening gap, logic bug in common path, significant test coverage gap.
- Medium: maintainability/readability issue that risks future bugs.
- Low: minor issue; low risk.
- Nit: stylistic; defer to existing lint/format rules unless it materially impacts readability.

How to present findings (single-screen actionable items)
- Group by severity (Critical → Nit). List the top 3 quick wins up front.
- For each finding, include: Title, Location(s), Why, How to fix, Evidence, Suggested patch, Tests.
- Prefer concise explanations and targeted diffs over long prose.

Finding template (use this structure)
```
Severity: High
Title: Validate request body for POST /branches
Location: api/src/routes/branch.ts:42-75
Why: Unvalidated input may cause unexpected state and security issues.
How to fix: Add a schema (zod) and validate req.body; return 400 on invalid payload.
Evidence: No checks before using properties from req.body.
Suggested patch (excerpt):
	// before handler
	const BranchSchema = z.object({
		branchId: z.number().int().positive(),
		headquartersId: z.number().int().positive(),
		name: z.string().min(1),
		description: z.string().optional(),
		address: z.string().min(1),
		contactPerson: z.string().min(1),
		email: z.string().email(),
		phone: z.string().min(7)
	});
	// in route
	const parsed = BranchSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ errors: parsed.error.issues });

Tests: Add a test that POSTs an invalid email and expects 400.
```

Auto-fix rubric
- Safe refactors (rename, dead code removal, minor validation) → provide a ready-to-apply patch.
- Risky or behavior-changing edits → provide steps and guarded diffs, require author confirmation.
- Don’t churn formatting that is already covered by linters/formatters.

Pass/fail guidance
- Request changes if any Critical/High findings are present without clear remediation.
- Approve with comments if only Medium/Low/Nit remain and are either ticketed or trivially fixed.

Short PR summary back to author (use this outline)
- What changed (1–2 sentences).
- Risk assessment (green/yellow/red) with reason.
- Top 3 action items with links to lines.
- Confidence level and suggested next checks (build, tests, manual click-path).

Repository-specific notes
- API route tests should follow `api/src/routes/branch.test.ts` pattern (in-memory Express + Supertest).
- Keep `api/api-swagger.json` in sync with API changes.
- Frontend dev server runs on 5137; API on 3000. Ensure CORS and config remain compatible.

