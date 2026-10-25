---
name: design-system
description: Visual language, tokens, components and motion rules for the Sortir UI. Use before writing or changing any CSS, component markup or animation.
---

# Design system: "a calm, editorial city guide"

**Intent.** Minimal and light. Warm porcelain background, white cards, one cobalt accent, a serif
for the headline and a clean sans for everything else. Restraint is the style: motion only where it
explains something, colour only where it carries meaning.

The look comes from a Google Stitch design (see `docs/design-brief-stitch.md`). Behaviour was kept,
and anything that would need a feature we do not have (account, newsletter, extra pages) was left out.

## Tokens (the only source: `src/styles/tokens.css`)
| Group | Tokens | Use |
|-------|--------|-----|
| Surfaces | `--porcelain` `#fafaf8`, `--surface` white, `--subtle` `#f1f5f9`, `--edge` `#e2e8f0` | page, cards and inputs, tracks and placeholders, 1px borders |
| Text | `--ink-900` to `--ink-500` | `--ink-500` is the lightest allowed for text (4.6:1). `--ink-400` is for icons only. |
| Accent | `--cobalt-50/100/200/600/700` | active filter, primary button, selection, links |
| Status | `--free-*` (green), `--few-*` (amber) | price "free" and "few seats left" only |
| Type | `--font-sans` Plus Jakarta Sans, `--font-serif` Newsreader | serif: headline, drawer title, empty-state sentence. Sans: all else. |
| Shape | `--radius-sm/--radius/--radius-lg/--radius-pill`, `--shadow-sm/md/lg` | buttons 12px, cards 16px, chips pill |

Never hard-code a colour or font in a component. Add a token first, and justify it. The one exception is
the map: Leaflet draws on a canvas and cannot read CSS variables, so `MapView.tsx` mirrors two token values.

## Components (reuse before writing new markup)
`src/components/ui/` holds the primitives. Page components compose them.

| Primitive | Use it for |
|-----------|-----------|
| `Button` (`primary`, `secondary`) | every button. No raw `<button className="btn">`. |
| `Chip` | toggle pills (categories). Pressed chips show a close icon. |
| `Segmented<T>` | single choice with a sliding highlight (date filter, language). `tone="solid"` or `"quiet"`. |
| `Switch` | on/off settings (free only, near me). |
| `Badge` (`neutral`, `free`, `few`, `brand`) | price, availability, category. |
| `StateMessage` | every empty or error state: one sentence and one action. |
| `Icon` | the only icon source (one 20px grid, 1.6px stroke). No emoji, no icon font. |
| `.skeleton` | loading placeholder (slow shimmer). |

Feature folders: `layout/` (Header, Masthead, Footer), `filters/`, `events/`, `drawer/`, `map/`.
CSS lives next to the component and is imported by it. Shared primitives are in `ui/ui.css`.

## Rules
- White cards on a porcelain page, 1px `--edge` border, soft shadow that grows on hover. No gradients, no glow.
- One accent. Colour carries meaning: cobalt = active or actionable, green = free, amber = few seats.
- Event cards: cover image on the left (16:9 on mobile), date chip on the image, small uppercase meta line,
  title, two-line summary, then a footer with price, seats and a call to action.
- The whole card is one click target through a stretched `::after` on the title button. Never nest a button in it.
- No cover image, or a failed one: a quiet placeholder (`Thumb`), never a broken icon.
- Copy is specific and calm ("Only 3 seats left" / "Plus que 3 places"). Both languages have the same tone.
- Layouts must survive both languages: English is shorter, French is about 15 to 20% longer. Never size a box to one language's text.
- One signature detail per screen. Here: the headline rewrites itself with the date filter.
- Do not invent features in the UI (login, newsletter, bookmarks, fake "live" indicators).

## Motion
- Purpose first. Motion explains change (list entering, panel arriving, selection moving). It never decorates.
- 150 to 350 ms. Easing `cubic-bezier(.2,.7,.2,1)`: quick start, soft landing.
- List entrance staggers at most 10 items, 30 ms apart.
- Shared elements use `layoutId` (inside `Segmented`, the highlight slides between options).
- The drawer slides from the right, the seat meter fills, the success check draws itself.
- `MotionConfig reducedMotion="user"` plus a CSS media query: reduced-motion users get no movement.

## States (every async view)
- Loading: skeleton cards, never a spinner on a blank page.
- Empty: one serif sentence plus a way out (`StateMessage`).
- Error: a plain message plus a retry button (`StateMessage`).

## Accessibility
- Real `<button>`, labels, `aria-pressed` on toggles, `role="switch"` on switches, `role="dialog"` on the drawer, Escape closes it.
- Visible focus ring (`--cobalt-600`, 2px). Text contrast at least 4.5:1.
- Touch targets at least 40px (chips and switches 34px high with spacing). Layout works from 500px up (and below).
