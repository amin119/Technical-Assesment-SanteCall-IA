---
name: design-system
description: Visual language, tokens and motion rules for the Sortir UI. Use before writing or changing any CSS, component markup or animation.
---

# Design system — "a printed city guide that moves"

**Intent**: minimal, editorial, warm. It should feel designed by a person with a point of view,
not generated. Restraint is the style. One accent color. Typography does the heavy lifting.

## Tokens (defined once in `styles/tokens.css`)
| Token | Value | Use |
|-------|-------|-----|
| `--paper` | `#f4f0e8` | page background (warm off-white, never pure white) |
| `--paper-2` | `#ebe5d9` | hover rows, inputs |
| `--ink` | `#17140f` | text (never pure black) |
| `--ink-2` | `#6b655a` | secondary text |
| `--line` | `#d9d2c3` | 1px hairlines |
| `--accent` | `#e0452b` | the ONLY accent: selection, primary action, map dot |
| Display font | Instrument Serif | headings, big date numerals |
| Text font | Hanken Grotesk | everything else |

## Anti "AI-generated" rules (important)
- No purple/blue gradients, no glassmorphism, no glowing shadows, no emoji as icons.
- No grid of identical rounded cards with drop shadows. Results are an **editorial list** with
  hairline separators and large date numerals.
- Almost no border-radius (2–4px on inputs, full pill only for tiny tags). No default Tailwind look.
- Few colors: paper, ink, one accent. Category is shown by text, not a rainbow of badges.
- Generous whitespace, strong alignment to a 4px grid, real typographic hierarchy.
- Copy is specific and calm ("Samedi 25 oct."), not marketing filler.

## Motion rules
- Purpose first: motion explains change (a list re-ordering, a panel arriving), never decorates.
- Durations 150–350ms. Easing `cubic-bezier(.2,.7,.2,1)` (fast out, soft landing).
- Staggered list entrance (max 12 items staggered, 30ms apart).
- Shared underline slides between active filters (`layoutId`).
- Detail panel slides in from the right; the seat meter fills; success draws a check mark.
- `prefers-reduced-motion`: no translate/scale, opacity only.

## States
Loading = skeleton rows with a slow shimmer. Empty = one sentence + a way out ("Effacer les filtres").
Error = plain message + retry button. Never a blank screen.
