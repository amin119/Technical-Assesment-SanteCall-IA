---
name: design-system
description: Visual language, tokens and motion rules for the Sortir UI. Use before writing or changing any CSS, component markup or animation.
---

# Design system: "a printed city guide that moves"

**Intent.** Minimal, editorial, warm. It should feel designed by a person with a point of view, not
generated. Restraint is the style: one accent colour, typography does the heavy lifting, motion only
where it explains something.

## Tokens (the only source: `src/styles/tokens.css`)
| Token | Value | Use |
|-------|-------|-----|
| `--paper` | `#f4f0e8` | page background (warm off-white, never pure white) |
| `--paper-2` | `#ebe5d9` | hover rows, reservation panel, map background |
| `--ink` | `#17140f` | text (never pure black) |
| `--ink-2` | `#6b655a` | secondary text (5.2:1 on paper) |
| `--line` | `#d9d2c3` | 1px hairlines |
| `--accent` | `#e0452b` | large shapes only: underline, map dot, hero word, seat bar |
| `--accent-ink` | `#b8321b` | the same red for small text and buttons (passes AA contrast) |
| `--font-display` | Instrument Serif | headline, titles, big date numerals |
| `--font-text` | Hanken Grotesk | everything else |

Never hard-code a colour or font in a component. Add a token first, and justify it.

## Anti "AI-generated" rules
- No purple or blue gradients, no glassmorphism, no glow shadows, no emoji as icons.
- No grid of identical rounded cards with shadows. Results are an **editorial list**: hairline
  separators, a large serif date numeral, a serif title.
- Border radius is 2px. Pills are not used.
- Colours: paper, ink, one accent. Categories are plain text, not a rainbow of badges.
- Generous whitespace, 4px rhythm, a real type scale (12 / 13 / 15 / 28 / display).
- Copy is specific and calm ("Plus que 3 places", "Rien ne correspond à ces filtres"), never filler.
- One signature detail per screen, not ten. Here: the headline rewrites itself with the date filter.

## Motion
- Purpose first. Motion explains change (list entering, panel arriving, selection moving). It never
  decorates.
- 150 to 350 ms. Easing `cubic-bezier(.2,.7,.2,1)`: quick start, soft landing.
- List entrance staggers at most 12 items, 30 ms apart.
- Shared elements use `layoutId` (the date-filter underline slides between tabs).
- The drawer slides from the right, the seat meter fills, the success check draws itself.
- `MotionConfig reducedMotion="user"` plus a CSS media query: reduced-motion users get opacity only.

## States (every async view)
- Loading: skeleton rows with a slow shimmer, never a spinner on a blank page.
- Empty: one sentence in the display font plus a way out.
- Error: a plain message plus a retry button.

## Accessibility
- Real `<button>`, labels, `aria-pressed` on toggles, `role="dialog"` on the drawer, Escape closes it.
- Visible focus ring (`--accent-ink`, 2px). Text contrast at least 4.5:1.
- Touch targets at least 40px. Layout works from 500px up (and below).
