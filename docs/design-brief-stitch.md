# Design brief: Sortir (for Google Stitch)

How to use this file:
1. Paste **Part 1 (Master prompt)** into Stitch first. It sets the product, the mood and the rules.
2. Then paste **one screen prompt at a time** from Part 3. Review each result before moving on.
3. Use the **refinement prompts** in Part 5 to adjust.
4. Ask for the **design system** (Part 4) once you like the direction, so everything stays consistent.

Write-ups are in English because Stitch works best in English. The product itself is bilingual (French and English).

---

## Part 1. Master prompt (paste this first)

> Design a minimalist, calm and attractive web app called **Sortir**. It helps people in Paris find things to do (concerts, theatre, exhibitions, sport, talks, family activities) and reserve a seat.
>
> **Who uses it:** Parisians and visitors, on phone and on laptop, usually deciding quickly: "what can I do tonight / this weekend / near me?"
>
> **What they do:** browse a long list of events, narrow it with a few filters (date, category, free, near me, search), see the events on a map, open one event for details, and reserve a seat with just an email address. There are no accounts and no login.
>
> **Look and feel:** simple, quiet, confident, premium. Lots of white space, a restrained palette (neutral background, dark text, ONE accent colour), beautiful typography with a clear hierarchy, subtle and meaningful motion. It should feel like a well-designed city guide, not a generic dashboard or template. Photography should do the emotional work: events have cover images.
>
> **Avoid:** busy layouts, many colours, heavy shadows, gradients everywhere, glassmorphism, emoji as icons, generic identical rounded cards stuffed with badges, clutter, tiny text.
>
> **Deliver:** desktop (1440 px wide) and mobile (390 px wide) versions of each screen I ask for, in a consistent system. The interface exists in French and English, so leave room for French labels, which are about 20% longer.

---

## Part 2. The product in detail

### 2.1 What the platform is
- A single-page web app. There are no accounts, no login, no checkout.
- Data: about 3,000 real upcoming Paris events (next 90 days), refreshed from Paris Open Data.
- Reservation is a lightweight "reserve a seat" with an email address. It must feel instant and trustworthy. When two people try for the last seat at the same moment, one gets it and the other sees a clear "sold out" message.
- Languages: French and English, switchable from the header. The interface text is translated. The event titles and descriptions are always in French (they are published that way), so the design must work with French event text even when the interface is English.

### 2.2 Navigation map
There is only one page. Everything happens through filters and a detail panel.

```
Home / Browse  (the only page)
├── Header: logo (left)  ·  language switch FR | EN (right)
├── Headline that rewrites itself with the date choice + event count
├── Filter area
│   ├── Search field
│   ├── When (pick one): All · Today · Tomorrow · This weekend · Next 7 days
│   ├── Category (pick several, each with a count)
│   └── Extras: Free (toggle) · Near me (toggle) · Clear (appears when something is set)
├── Results
│   ├── Event list (long, loads 30 at a time with "Show more")
│   └── Map showing the same events as dots
└── Event detail (opens over the page, closes with X / Escape / tapping outside)
    ├── Cover image, category, price, title
    ├── When · Where · Price details
    ├── Seat availability + Reserve form
    ├── Description
    └── Link to the official page (paris.fr)
```

Moving between things:
- Clicking an event in the list OR a dot on the map opens its detail.
- Hovering an event in the list highlights its dot on the map, and the other way around (desktop).
- Changing any filter updates the list, the map and the counts together, with no page reload.
- Filters and the open event are in the web address, so a link can be shared or bookmarked.
- On mobile, the user switches between "List" and "Map" with one floating button.
- The detail opens as a side panel on desktop and as a full-screen sheet (slides up) on mobile.

### 2.3 The filters, exactly
| Filter | Type | Options |
|---|---|---|
| Search | text field | Searches title, summary and venue. Placeholder: "An artist, a venue, a word…" |
| When | choose one | All · Today · Tomorrow · This weekend · Next 7 days |
| Category | choose several | Concerts · Theatre · Shows · Exhibitions · Sport · Cinema · Talks · Family · Workshops & leisure · Other. Each shows how many events it would give, and is disabled when 0. |
| Free | on / off | Only free events |
| Near me | on / off | Uses the visitor's location, shows events within 3 km, sorts by distance, shows distance on each event (e.g. "1.4 km"), and draws a faint 3 km circle on the map. If location is refused, show a short friendly note. |
| Clear | link | Only appears when a filter is active |

### 2.4 One event in the list: what it shows
Required:
- **Date**: weekday + day number + month (e.g. "Sat 24 Oct"). For events already running (exhibitions, long programmes), show "until 31 Dec" instead.
- **Category** and **venue**, plus **Paris district** (e.g. "Médiathèque Jean-Pierre Melville · 13th").
- **Title**: can be long (up to 2–3 lines). It is French.
- **Short summary**: about 2 lines, French. Can be missing.
- **Price**: "Free" (should stand out gently) or "Paid".
- **Seats status**: "72 seats" / "Only 3 seats left" (urgent) / "Sold out".
- **Distance** (only when "Near me" is on).

Available but not currently shown, so please consider using them:
- A **cover image** for most events (varied sizes and quality, sometimes missing). A thumbnail or a large image could make the list far more attractive. Design a good fallback when there is no image.

### 2.5 The event detail: what it shows
- Cover image (when available)
- Category and price line
- Title (large)
- **When**: free text such as "Sunday 25 October 2026, from 4pm to 6pm" (can be several lines for recurring events)
- **Where**: venue, street address, postcode
- **Price details**: e.g. "Free entry, donations welcome" (can be missing)
- **Reservation block**:
  - A seat meter: a thin bar showing how full the event is, and text like "30 seats left of 30"
  - Email field + "Reserve" button
  - Becomes "Sold out" and disabled when full
  - Success state: a small animated check, "Seat reserved. Booked for name@email.com."
  - Error states (short, kind, one line each): sold out just now, already reserved with this email, many people booking right now (try again), invalid email
- **Description**: several paragraphs of plain text (French)
- Link: "View on paris.fr ↗"

### 2.6 The map
- Shows one dot per event matching the current filters (up to about 2,000).
- Clean, light, quiet map style. The dots are the focus.
- Hover or focus on a list item highlights the dot and shows its title.
- Click a dot to open that event.
- The selected event's dot is larger and uses the accent colour, and the map moves to it.
- When "Near me" is on: dashed circle around the visitor.

### 2.7 States to design (every one of them)
| State | What to show |
|---|---|
| Loading list | Skeleton rows, calm, no spinner on a blank page |
| Empty (no result) | One friendly sentence ("Nothing matches these filters.") and a "Clear filters" button |
| Error | Short message and "Try again" |
| Loading more | Button text changes to "Loading…" |
| Detail loading | Skeleton |
| Detail error | Message and "Try again" |
| Reservation: idle / sending / success / each error / sold out | See 2.5 |
| Location refused | Short note near the filters |
| No cover image | Elegant fallback (colour, pattern or typographic) |

### 2.8 Real content to use in the mockups
Use these so the design is tested with realistic text (all event text stays in French):

1. **Sat 24 Oct** · Concerts · Médiathèque Jean-Pierre Melville · 13th
   *Concert du quintette de cuivres Q5* — "Vibrez au son éclatant des cuivres avec le quintette Q5 !" · Free · 72 seats
2. **Sat 24 Oct** · Concerts · Centre Culturel Suisse Paris · 3rd
   *SuPERFORM - Une après-midi de performances au CCS* — "Le CCS se transforme en terrain de jeu artistique. Performances, films, lecture et musique expérimentale…" · Paid · Only 3 seats left
3. **Sun 25 Oct** · Concerts · Église Saint-Merry · 4th
   *Musique pour L'âme - Carlos Intrieri Ricci (Piano Soliste)* — Free · 30 seats
4. **until 31 Dec** · Exhibitions · Maison de l'Amérique Latine · 7th
   *Ceramic Art Fair Paris + glass* — Free · 165 seats
5. **Sun 25 Oct** · Sport · Parc des Princes · 16th
   *Un titre très long pour tester le retour à la ligne sur plusieurs lignes dans la liste et dans le détail* — Paid · Sold out

Headline examples (it changes with the date filter): "What to do in Paris *this weekend*?" · "…*today*?" · "…*tomorrow*?" · "…*this week*?" · "…*right now*?" followed by "1,209 events".

Detail page example: *Concert du quintette de cuivres Q5* · Sun 25 October 2026, 4pm–5:30pm · Médiathèque Jean-Pierre Melville, 79 rue Nationale, 75013 · Free entry · 72 seats left of 72 · three paragraphs of French description · "View on paris.fr ↗".

---

## Part 3. Screen prompts (paste one at a time)

### Screen 1: Home / Browse, desktop (1440 px)
> Design the **home screen** of Sortir on desktop. Top: small logo on the left, FR | EN language switch on the right. Below, a large, elegant headline "What to do in Paris this weekend?" where "this weekend" is highlighted with the accent colour, and a small line "1,209 events". Under it, a quiet filter area: a search field with the placeholder "An artist, a venue, a word…", five date choices (All, Today, Tomorrow, This weekend, Next 7 days) with the selected one clearly marked, ten category choices with small counts (Concerts 158, Theatre 116, Shows 51, Exhibitions 278, Sport 183, Cinema 35, Talks 102, Family 125, Workshops & leisure 137, Other 24), and two toggles: Free and Near me. Below, split the page: on the left a scrollable list of events (use the 5 sample events from the content list, with date, category, venue, title, summary, price, seats) and on the right a sticky map of Paris with small dots for events. One event is selected: its row is highlighted and its dot on the map is larger in the accent colour. End the list with a "Show more" button. Keep it minimal, spacious and calm. Use cover images in the list if it makes it more attractive.

### Screen 2: Home / Browse, mobile (390 px)
> Design the **mobile home screen** of Sortir. Same content and the same filters, adapted for a phone: compact header with logo and FR | EN, the headline, a search field, the date choices as a horizontally scrollable row, the categories as a horizontally scrollable row (not a long wrapping block), Free and Near me toggles, then the event list full width. A single floating button at the bottom ("Map") switches to a full-screen map view; design that map view too, with the same filters on top and the list button to return. Touch targets at least 44 px. Make sure the first event is visible without much scrolling.

### Screen 3: Event detail, desktop
> Design the **event detail** for Sortir on desktop, opening as a right-hand panel over the home screen (the page behind is dimmed). Contents from top to bottom: close button, cover image, small line "Concerts · Free", large title "Concert du quintette de cuivres Q5", three clearly separated facts (When, Where, Price details), then a **reservation block**: a thin seat meter and "72 seats left of 72", an email field with a "Reserve" button. Then the description (three short paragraphs) and a "View on paris.fr ↗" link. The reservation block is the most important element: make it obvious and trustworthy but not loud. Show the panel in its default state.

### Screen 4: Event detail, mobile
> Design the **event detail on mobile** as a full-screen sheet that slides up, with a visible close or back button. Same content as desktop. Consider a **sticky bottom bar** with the seat status ("Only 3 seats left") and a "Reserve" button, which opens or scrolls to the email field. Keep text comfortable to read.

### Screen 5: Reservation states
> Design the **reservation block** in all its states, side by side, for desktop and mobile: (1) idle with an empty email, (2) sending ("Reserving…", button disabled), (3) success (small check animation, "Seat reserved. Booked for name@email.com."), (4) error: already reserved with this email, (5) error: sold out just now ("Sold out: someone took the last seat just before you."), (6) the event is sold out from the start (field and button disabled, meter full, "Sold out"), (7) invalid email, (8) few seats left (meter in the accent colour, "Only 3 seats left"). Each message is one calm sentence, never alarming.

### Screen 6: Empty, loading and error states
> Design the **empty, loading and error states** for the event list: (1) skeleton loading rows, (2) no results ("Nothing matches these filters." with a "Clear filters" button), (3) loading failed ("Couldn't load events." with a "Try again" button), (4) "Near me" with location refused (a short friendly note under the filters). Also design the **no-cover-image fallback** for an event. Keep them beautiful and human, never a blank screen.

### Screen 7: French version
> Show the **home screen and the event detail in French** to check the layout holds. Interface texts: headline "Que faire à Paris ce week-end ?", search "Un artiste, un lieu, un mot…", dates "Tout, Aujourd'hui, Demain, Ce week-end, 7 jours", categories "Concerts, Théâtre, Spectacles, Expositions, Sport, Cinéma, Conférences, En famille, Ateliers & loisirs, Autres", toggles "Gratuit, Autour de moi, Effacer", seats "72 places / Plus que 3 places / Complet", reservation "Votre e-mail, Réserver, Place réservée.". Nothing should overflow or wrap badly.

---

## Part 4. Design system prompt (use once you like the direction)

> Create the **design system** for Sortir from the screens above: colour palette (neutral background, text, secondary text, hairline, and one accent, with a slightly darker accent variant for small text so contrast is at least 4.5:1), typography (one expressive typeface for the headline and event titles, one clean sans-serif for everything else, with a size scale), spacing scale, corner radius, and the components: header and language switch, search field, "When" segmented choice, category filter item (normal, selected, disabled), toggle (off, on), event row (normal, hover, selected, ongoing-event date, sold-out), seat meter, button (primary, secondary, disabled, loading), email field (normal, focus, error), map dot (normal, hover, selected), floating map/list button, skeleton row, empty state, message line (error, success). Show each component in its states.

---

## Part 5. Refinement prompts (use as needed)

- "Make it **simpler**: remove anything that is not essential to finding and reserving an event."
- "Give it **more whitespace** and a calmer rhythm. Fewer lines and borders."
- "Make the **photography** the hero: larger images in the list, with the text overlaid or beside them."
- "Use a **more distinctive typeface** for titles and make the date feel like a strong typographic element."
- "Try a **warmer / cooler / darker** palette while keeping ONE accent colour."
- "Make the **filters feel lighter**: collapse the categories into a single row that scrolls, and tuck Free and Near me into a small menu."
- "Reduce the visual weight of the map; make it feel integrated, not like a separate box."
- "Show a **dark mode** version."
- "Check **accessibility**: contrast of every text at least 4.5:1, touch targets at least 44 px, visible focus states."

---

## Part 6. Constraints the design must respect

- **Responsive**: 390 px (phone), 768 px (tablet), 1440 px (laptop). Mobile is as important as desktop.
- **Both languages**: French is about 20% longer than English. Never rely on a fixed box width for a label.
- **Long, French event text**: titles up to 3 lines, summaries may be missing, descriptions are several paragraphs. Images vary in ratio and may be missing.
- **A long list**: about 3,000 events. Lists must stay fast to scan.
- **Accessibility**: text contrast at least 4.5:1, real buttons, visible focus, nothing conveyed by colour alone, motion reduced for people who ask for it.
- **Motion** (describe it on the designs): the headline word swaps when the date choice changes; the selected date-choice underline slides to the new choice; list items fade in gently one after another; the detail panel slides in from the right (from the bottom on mobile); the seat meter fills; the success check draws itself. Durations between 150 and 350 ms. Motion explains change, it never decorates.
- **Buildable**: this will be built in React with plain CSS, so prefer a clean, systematic layout, a small number of components, and a limited palette over one-off effects.
- **No account area, no cart, no payment, no user profile.** Do not invent extra pages.

---

## What we already know about the current look (so you can do better)

The current version uses a warm off-white background, black text, one red-orange accent, a serif headline and an editorial list. If you find it flat, heavy, or repetitive, treat it as a starting point to improve on, **not** a constraint. You are free to propose a different palette, typography and layout, as long as the product behaviour in Part 2 stays the same.
