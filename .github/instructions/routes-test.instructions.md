---
applyTo: "octocat-supply-copilot-demo/api/src/routes/*.test.ts"
---

# Route tests — best practices

This document describes recommended patterns for tests that exercise Express route handlers in `api/src/routes/*.test.ts`. Vitest + Supertest + an in-memory Express app so tests are fast, isolated, and easy to reason about.

## Tools & conventions
- Test runner: `vitest`.
- HTTP assertions: `supertest` against an in-memory `express()` app (do not start a real server).
- File naming: use `*.test.ts` and keep test files next to the route they exercise.
- Keep tests deterministic and fast — avoid network IO or long-running processes.

## Standard test structure (recommended)
1. Setup a fresh Express instance in `beforeEach`:
   - `app = express()`
   - `app.use(express.json())`
   - mount the router: `app.use('/branches', branchRouter)` (adjust path as needed)
   - reset in-memory state (call exported `reset...` helper from the router or restore seed data)
2. Write focused `it` tests for each behaviour (happy path + error cases).
3. Assert both HTTP status and response body where applicable.

## What to test (minimum coverage)
- POST (create): returns 201 and the created object is returned.
- GET all: returns 200 and the collection matches the seeded data.
- GET by id: returns 200 for existing IDs and 404 for non-existing IDs.
- PUT (update): returns 200 and the resource is updated.
- DELETE: returns 204 for successful delete and subsequent GET returns 404.
- Validation and error paths: invalid payloads, missing fields, malformed IDs.

## State isolation
- Tests must be independent: use `beforeEach` to restore in-memory state.
- Prefer router modules that export a test helper (e.g. `resetBranches()` in `branch.ts`) to restore internal arrays.
- If seed data is imported, use a deep clone when tests mutate it (avoid mutating the original seed module).

## Fast, reliable tests
- Use `supertest(app)` (no listen()) so tests don't bind to network ports and remain fast.
- Use `async/await` for request calls; avoid callback-style `done` unless necessary.
- Avoid external resources in route handlers for unit-style route tests; mock those dependencies when needed.

## TypeScript guidance
- Use typed fixtures and response expectations when possible to catch regressions at compile time.
- Keep `any` to a minimum; assert shapes with `expect(...).toMatchObject(...)` or `toEqual(...)`.

## Test helpers & DRY
- Create small helpers for common operations (e.g. `createBranch(app, payload)`) to keep tests concise and readable.
- Put shared fixtures or helper functions in `api/src/routes/test-utils.ts` or a `tests/fixtures` folder.

## CI and coverage
- Run the API tests with `npm run test:api` (or `vitest` directly) in CI.
- Keep tests isolated from Docker or external services so CI runs quickly and deterministically.

## When a route depends on external services
- Prefer dependency injection so the router can receive a mocked service during tests.
- Use `vi.spyOn` or `vi.mock` to stub network calls or database clients.

## Small template (follow the pattern in `branch.test.ts`)
```ts
import { beforeEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import myRouter, { resetMyResource } from './myRoute';
import { seedData } from '../seedData';

let app: express.Express;

describe('MyRoute API', () => {
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/myroute', myRouter);
    resetMyResource(); // restore internal state
  });

  it('creates a resource', async () => {
    const payload = { /* ... */ };
    const res = await request(app).post('/myroute').send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toEqual(payload);
  });

  // ... other tests: GET all, GET/:id, PUT, DELETE, 404 cases
});
```

## Final notes
- Keep tests small, focused, and isolated.
- Export simple reset/seed helpers from route modules if they use in-memory state.
- Prefer integration-style route tests (in-memory express + supertest) for route behavior, and mock only external dependencies.

Add or modify these rules if the project adopts a different architecture (database-backed routes, external services, etc.).