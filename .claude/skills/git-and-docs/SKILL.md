---
name: git-and-docs
description: Commit conventions, CI expectations and documentation style. Use when committing, editing workflows, or writing README/docs.
---

# Git, CI and docs

## Commits
- Small and focused: one idea per commit. Imperative subject under 60 characters: `Add event filters`.
- The body (optional) explains *why*, not what.
- Run the checks first: backend `uv run ruff check . && uv run ruff format --check . && uv run pytest`,
  frontend `npm run lint && npm run typecheck && npm test && npm run build`.
- Never commit `.env`, `node_modules`, `.venv`, `dist`.
- Do not push or open pull requests unless the user asks.

## CI (`.github/workflows/ci.yml`)
- `backend`: a CockroachDB service container, `uv sync --frozen`, ruff, pytest.
- `frontend`: `npm ci`, lint, typecheck, test, build.
- `docker`: build the images. It only runs when the other two pass.
- A change to CI must be runnable locally with the commands above.

## Docs
Reader: a smart engineer who has never seen this repo and has 5 minutes (French speaker).
- Lead with what it does and how to run it.
- Short sentences. Define a term the first time it appears. Prefer a table or diagram to a paragraph.
- Always answer "why this choice, and what did we reject?". That is what an interview probes.
- Be honest about limits. Never state a number you did not measure.
- Update `docs/ARCHITECTURE.md` and `docs/DECISIONS.md` in the same commit as the change they describe.
- Project docs (`README.md`, `docs/`, the package READMEs) are written in **French**, in simple words. Code, comments, commit
  messages and the `.claude/skills/` files stay in **English**. The product UI is bilingual (French and English).
