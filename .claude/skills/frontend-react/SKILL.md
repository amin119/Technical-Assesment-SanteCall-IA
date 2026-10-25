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
- **The page number is part of the filters** (`?page=3`, 20 per page). Any filter change resets it to 1 (`setFilters` in
  `App.tsx`). Page maths lives in `lib/pagination.ts` (pure, tested). Use the `Pagination` primitive, not a "load more" button.
- Local UI state (form input, hover) uses `useState`. No global store library.

## Structure
`api/` (typed fetch client, types) · `hooks/` · `lib/` (pure, tested) · `i18n/` ·
`components/` grouped by feature (`ui/` primitives, `layout/`, `filters/`, `events/`, `drawer/`, `map/`) ·
`styles/` (tokens.css, base.css). Component CSS sits next to the component and is imported by it.

`App.tsx` only wires data to components. A component that appears twice becomes a primitive in `ui/`
(see the design-system skill for the list). Logic that is not rendering goes in a hook (`useLocate`, `useUrlState`).

## Rules
- Strict TypeScript. No `any`. API types in one file, mirrored from the backend schemas.
- Use semantic HTML: real `<button>`, `<nav>`, `<main>`, labelled inputs. Visible focus rings.
- Every async view has loading, empty, and error states, all designed (see design-system skill).
- Respect `prefers-reduced-motion`: animations collapse to opacity changes.
- Plain CSS with custom properties (tokens). No CSS framework, no UI kit. (The Stitch design was written in Tailwind; we
  translated it into tokens and classes so the repo has no build-time CSS dependency.)
- **No hard-coded user-facing text.** Every string lives in `src/i18n/messages.ts` in **both** French and
  English. Use `t('key')`, and `tp('base', n)` for plurals (keys `base_one` and `base_other`). TypeScript fails the build if
  one language is missing a key, and `i18n.test.ts` checks placeholders and plural forms.
- Format dates, numbers and ordinals through `lib/format.ts` (it uses `Intl` with the current language).
  Never write `'fr-FR'` or `toLocaleString()` in a component.
- Event titles and descriptions come from Paris Open Data in French: render them with `lang="fr"`, do not translate them.
- Show server errors by their `code` mapped to a translated message, never the API's English `message`.
- Code and comments are English. Project docs (README, `docs/`) are French.

## Gotchas
- **Keep render pure.** No `new Date()` or `Date.now()` during render (oxlint flags it). The URL-state
  hook stores a `stamp` when filters change, and "today" is derived from it.
- **No `setState` inside an effect to mirror props.** Adjust state during render (compare to the
  previous prop) or derive the value.
- **A debounced handler must read the latest callback** (a ref), not the one captured at keystroke time.
- **Single-column grids need `minmax(0, 1fr)`**, or long content stretches the page sideways.
- **Map tiles:** CARTO's free tiles need an API key now. We use OpenStreetMap tiles muted by a CSS
  filter. Production needs a tile provider.
- **Headless screenshots with motion:** a card can be captured at opacity 0 mid-animation. Pass
  `--force-prefers-reduced-motion` to Edge. (The DOM was fine, only the capture was early.)
- **Headless browsers enforce a minimum viewport (about 500px).** Screenshot mobile at 500, not 390.
- Leaflet is lazy-loaded (`React.lazy`) so it stays out of the first bundle.

## Before committing
`npm run lint && npm run typecheck && npm test && npm run build`
