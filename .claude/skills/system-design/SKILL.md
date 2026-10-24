---
name: system-design
description: Architecture principles, component boundaries and the checklist to run before changing how the system fits together. Use when adding a service, table, endpoint family, background job, cache or any cross-cutting behaviour, and when updating docs/ARCHITECTURE.md.
---

# System design

The authoritative description is `docs/ARCHITECTURE.md`. This skill is how to keep it true.

## Shape of the system
`web (nginx + SPA)` → `api (FastAPI, stateless)` → `CockroachDB (the only state)`.
`ingest` is a separate one-shot job that copies Paris Open Data into the database.

## Principles
1. **State lives in the database only.** The API holds none, so it can run as N copies. No in-process
   caches that affect correctness, no Python locks.
2. **Correctness rules live in the database.** Constraints (`CHECK`, `UNIQUE`, foreign keys) enforce
   invariants even when application code is wrong. Application code adds clear errors on top.
3. **Our copy of the data is the source for users.** Requests never call Paris Open Data. Upstream
   downtime must not affect browsing or booking.
4. **Ingestion is idempotent and isolated.** Re-running it is always safe, and it never touches
   `capacity` or `seats_taken`.
5. **Fail honestly.** Return a precise, retryable error (`409`, `503 busy`), never a hang or a silently
   wrong result.
6. **Side effects after commit.** Anything outside the database (email, webhooks) happens after the
   transaction commits, never inside code that may be retried.
7. **Boring first.** Add a queue, cache or new service only when a measured problem needs it. Write the
   scaling answer in `docs/ARCHITECTURE.md` section 7 instead of building it early.

## Checklist before a structural change
- Does it add state outside CockroachDB? If yes, why can't the database hold it?
- Which invariant could it break, and which constraint or test protects that invariant?
- What happens when two requests do this at the same instant? Write the test first.
- What happens when the dependency is slow or down? Is the failure visible and retryable?
- Is the change idempotent if repeated (retries, re-imports)?
- Update `docs/ARCHITECTURE.md` (diagram, failure table, scaling table) and add an entry to
  `docs/DECISIONS.md` with what was rejected.

## Keep docs honest
- Never claim a number we did not measure. Say "not benchmarked".
- Diagrams are Mermaid so they render on GitHub and live in the same commit as the code change.
