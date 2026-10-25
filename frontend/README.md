# Sortir web

Application monopage React + Vite + TypeScript. Voir le [README principal](../README.md) et
l'[architecture](../docs/ARCHITECTURE.md).

```bash
npm install
npm run dev        # http://localhost:5173, redirige /api vers localhost:8000
npm run lint && npm run typecheck && npm test && npm run build
```

## Organisation

```
src/components/
  ui/        briques réutilisables : Button, Chip, Segmented, Switch, Badge, StateMessage, Icon
  layout/    Header, Masthead (titre), Footer
  filters/   recherche, date, catégories, barre de filtres
  events/    carte d'événement, liste, miniature
  drawer/    panneau de détail, jauge de places, formulaire de réservation
  map/       carte Leaflet (chargée à la demande)
src/hooks/   données (TanStack Query), état dans l'URL, géolocalisation
src/i18n/    textes FR et EN
src/lib/     fonctions pures et testées
src/styles/  tokens.css (couleurs, polices, rayons) et base.css
```

Chaque composant a son CSS à côté de lui. Les règles de design sont dans `.claude/skills/design-system/SKILL.md`.
