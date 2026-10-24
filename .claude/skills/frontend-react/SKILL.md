---
name: frontend-react
description: Conventions for the React + Vite + TypeScript frontend (state, data fetching, structure, accessibility). Use before adding or changing code under frontend/.
---

# Frontend conventions

## Why React + Vite (and not Next.js)
The app is a client-side tool behind no login, with no SEO requirement for the first version. Next.js
would add a server runtime, routing conventions and deployment weight we do not need. Vite gives an
instant dev server and a static build served by nginx. If public SEO pages for each event become a
goal, Next.js is the natural migration (listed in the roadmap).

## State
- **Server data**: TanStack Query only. No `useEffect` + `fetch` + `useState` triples.
- **Filters and selected event live in the URL** (`?category=concert&when=weekend&event=abc`).
  Links are shareable, the back button works, refresh keeps the view. Hook: `useFilters`.
- Local UI state (form input, hover) uses `useState`. No global store library.

## Structure
`api/` (typed fetch client, types) · `hooks/` · `components/` (one folder or file per component) ·
`styles/` (tokens.css, global.css, component CSS next to the component).

## Rules
- Strict TypeScript. No `any`. API types in one file, mirrored from the backend schemas.
- Use semantic HTML: real `<button>`, `<nav>`, `<main>`, labelled inputs. Visible focus rings.
- Every async view has loading, empty, and error states, all designed (see design-system skill).
- Respect `prefers-reduced-motion`: animations collapse to opacity changes.
- Plain CSS with custom properties (tokens). No CSS framework, no UI kit.
- UI text is French. Code, comments and docs are English.

## Before committing
`npm run lint && npm run typecheck && npm test && npm run build`
