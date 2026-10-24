---
name: git-and-docs
description: Commit conventions, CI expectations and documentation style. Use when committing, editing workflows, or writing README/docs.
---

# Git, CI and docs

## Commits
- Small and focused: one idea per commit. Imperative subject, max ~60 chars: `Add event filters`.
- Body (optional) explains *why*, not what.
- Run lint + tests before committing. Never commit `.env`, `node_modules`, `.venv`.
- Do not push or open PRs unless the user asks.

## CI (`.github/workflows/ci.yml`)
- `backend`: CockroachDB service container, `uv sync --frozen`, ruff, pytest.
- `frontend`: `npm ci`, lint, typecheck, test, build.
- `docker`: build both images (no push).

## Writing docs
Reader = a smart engineer who has never seen this repo and has 5 minutes.
- Start with what it does and how to run it (3 commands).
- Short sentences. Define a term the first time. Prefer a table or a small diagram to a paragraph.
- Always answer "why this choice, and what did we reject?". That is what the interview will probe.
- Be honest about limits and next steps. Never oversell.
