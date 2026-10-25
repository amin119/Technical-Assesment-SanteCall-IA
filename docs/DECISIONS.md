# Décisions

Pour chaque entrée : ce que nous avons choisi, pourquoi, et ce à quoi nous avons renoncé. Court exprès.

## 1. Base de données : CockroachDB (pas Cassandra)

**Choix :** CockroachDB.

**Pourquoi.** L'exigence est que deux réservations simultanées ne dépassent jamais la capacité. C'est un problème de *cohérence*.

- CockroachDB offre des **transactions sérialisables par défaut**. C'est la base elle-même qui garantit le résultat, et notre code n'a qu'à réessayer.
- Elle parle le **SQL de PostgreSQL** : filtrer par date, catégorie, prix et distance tient dans une seule requête, et les contraintes `CHECK`/`UNIQUE` appliquent les règles.
- Elle passe à l'échelle et survit à la perte d'un nœud avec le même SQL.

**Pourquoi pas Cassandra.** Cassandra est conçue pour un très gros débit d'écriture avec une cohérence éventuelle.

- Un stock fiable demande des *transactions légères* (Paxos). Elles marchent, mais sont lentes et limitées à une partition.
- Les compteurs Cassandra ne savent pas dire « incrémenter seulement si on reste sous la limite ».
- La recherche demande beaucoup de combinaisons de filtres. Cassandra veut une table pré-construite par forme de requête : il faudrait dupliquer les données pour chaque filtre.
- Bilan : elle rendrait plus difficile ce qui nous importe le plus (réserver correctement) et beaucoup plus difficile ce que nous faisons le plus (chercher de façon souple).

**Coût.** CockroachDB est plus lourde que Postgres pour une petite application, et les transactions en conflit doivent être relancées (nous le gérons à un seul endroit, `db.run_transaction`).

## 2. Backend : FastAPI (pas NestJS)

**Pourquoi.** Le travail est limité par les entrées/sorties (attente de la base), là où l'`async` de Python suffit. FastAPI apporte la validation typée des requêtes et réponses et une page OpenAPI automatique (`/docs`) avec très peu de code. Python convient aussi au nettoyage des données à l'import.

**Pourquoi pas NestJS.** Un très bon framework, et le bon choix pour une équipe déjà en TypeScript partout. Pour ce périmètre, il ajoute de la structure (modules, décorateurs, injection de dépendances) dont nous n'avons pas besoin.

**Coût.** Deux langages dans le dépôt (Python et TypeScript). Les types de l'API sont recopiés à la main dans `frontend/src/api/types.ts`. Les générer depuis OpenAPI est une étape suivante.

## 3. Accès à la base : psycopg 3 et SQL brut (pas d'ORM)

**Pourquoi.** Le code le plus important du projet est une transaction avec nouvelle tentative. Nous voulons le voir sur un seul écran, pas caché derrière le comportement de session d'un ORM. Les requêtes sont peu nombreuses et le SQL est court.

**Coût.** Plus de chaînes SQL à maintenir. Pas de migrations automatiques : `schema.sql` est idempotent et s'exécute au démarrage. Un outil de migration (Alembic ou équivalent) sera l'étape suivante quand le schéma évoluera.

## 4. Gestion des paquets : uv (pas pip)

**Pourquoi.** `uv` remplace `pip`, `venv`, `pip-tools` et `pyenv` par un seul outil rapide.

- Les installations sont 10 à 100 fois plus rapides (écrit en Rust, avec un cache global).
- `uv.lock` fige exactement chaque dépendance : votre machine, la CI et Docker ont des versions identiques. Un simple `pip install -r requirements.txt` ne verrouille pas les dépendances indirectes.
- Il installe la bonne version de Python à votre place.
- `uv run` évite d'activer l'environnement virtuel à la main.

**Coût.** Plus récent que pip, donc moins connu. Le flux de travail reste petit (`uv sync`, `uv add`, `uv run`).

## 5. Frontend : React + Vite + TypeScript (pas Next.js)

**Pourquoi.** Une application côté client, sans connexion et sans besoin d'être indexée par les moteurs de recherche. Vite offre un serveur de développement instantané et une version statique servie par nginx. Next.js ajouterait un serveur Node, des conventions de routage et des modes de rendu que nous n'utiliserions pas.

**Coût.** Pas de rendu côté serveur, donc les pages d'événements ne sont pas indexables. Si le référencement devient un objectif, Next.js est la migration naturelle.

## 6. Briques du frontend

| Choix | Pourquoi | À la place de |
|---|---|---|
| TanStack Query | Cache, annulation de requêtes, nouvelles tentatives et « garder l'ancienne liste pendant le chargement » en quelques lignes | `useEffect` + `fetch` + `useState`, qui cache des bugs subtils (courses entre requêtes, données périmées) |
| Filtres dans l'URL | Liens partageables, bouton retour fonctionnel, survit au rechargement | Un état global (Redux, Zustand) |
| motion | Animations de mise en page et de transitions partagées, difficiles à écrire à la main | Des animations CSS écrites à la main partout |
| Leaflet + OpenStreetMap | Gratuit, sans clé d'API | Google Maps (clé, facturation). Mapbox (clé) |
| CSS simple avec variables | Contrôle total du rendu. Peu de dépendances. | Tailwind ou un kit d'interface, qui donnent souvent un rendu générique |
| Polices hébergées (`@fontsource-variable` : Plus Jakarta Sans, Newsreader) | Aucune requête tierce, aucun suivi, fonctionne hors ligne | Un lien Google Fonts |

Remarque sur les tuiles de carte : le serveur de tuiles standard d'OpenStreetMap convient pour une démo mais a une politique d'usage. La production devrait utiliser un fournisseur de tuiles ou des tuiles auto-hébergées. (Les tuiles gratuites de CARTO demandent désormais une clé d'API, ce que nous avons découvert en testant.)

## 7. La capacité est fictive

Les données ouvertes ne contiennent aucun nombre de places : chaque événement reçoit donc une capacité stable de 20 à 200, calculée à partir d'une empreinte de son identifiant. Elle ne change jamais d'un import à l'autre. Les réservations sont donc une **démonstration de gestion correcte de la concurrence**, pas une vraie billetterie. Le pied de page le dit.

## 8. Le HTML de la source devient du texte brut

Les descriptions arrivent en HTML depuis un tiers. L'afficher dans le navigateur ouvre la porte aux failles de type « cross-site scripting ». Nous le retirons à l'import en gardant les sauts de paragraphe : le frontend n'affiche donc jamais de HTML non fiable.

## 9. L'import est une tâche ponctuelle séparée

Il ne fait pas partie du processus de l'API. Un redémarrage de l'API ne déclenche jamais un gros import, un import raté n'affecte jamais les requêtes, et la même commande marche en local, dans Docker et depuis un planificateur.

## 10. Ce que nous avons volontairement laissé de côté

| Laissé de côté | Pourquoi |
|---|---|
| Authentification et comptes | Hors du temps imparti. La réservation par e-mail seul est signalée comme une limite. |
| Annuler une réservation | Simple à ajouter (supprimer la ligne, décrémenter dans une transaction). Inutile pour prouver le point. |
| E-mail de confirmation | Demande un fournisseur d'e-mail. La transaction avec nouvelle tentative est déjà conçue pour que l'envoi se fasse **après** le commit. |
| Import planifié | Une commande aujourd'hui. Un cron ou une tâche CI s'ajoute en une ligne. |
| Tests de bout en bout dans un navigateur | Le backend et la logique sont couverts. Un test Playwright du parcours de réservation est le prochain test à ajouter. |

## 11. Traductions : français et anglais avec une petite couche typée

**Choix.** Environ 120 lignes de notre propre code dans `frontend/src/i18n/` : un fichier de messages par langue, une fonction `t()`, une fonction `tp()` pour les pluriels, et un sélecteur FR | EN.

**Pourquoi pas une bibliothèque (react-i18next, FormatJS).** Nous avons une centaine de courtes phrases et deux langues. Une bibliothèque ajoute une dépendance, un chargeur à l'exécution et de la configuration pour peu de gain. Notre version apporte aussi ce que les bibliothèques ne donnent pas par défaut : **`en` est typé `Record<MessageKey, string>`, donc le projet ne compile pas si une clé manque dans une langue.** Un test vérifie aussi que les `{variables}` correspondent et que chaque pluriel a ses deux formes.

**Comment ça marche.**
- Les pluriels utilisent `Intl.PluralRules` du navigateur : chaque langue suit sa propre règle (le français dit « 0 événement », l'anglais « 0 events »).
- Les dates, nombres et ordinaux utilisent aussi `Intl` (`sam. 7 nov.` et `Sat 7 Nov`, `2 960` et `2,960`, `9e` et `9th`). Les dates affichent toujours l'heure de Paris.
- La langue de départ est `?lang=` dans l'URL, puis le choix enregistré, puis la langue du navigateur. `<html lang>` et le titre de la page suivent.
- Les noms de catégories sont traduits dans le navigateur à partir du *slug*. L'API garde son `label` français en secours pour d'autres clients et pour toute nouvelle catégorie inconnue du navigateur.
- Erreurs de réservation : l'API renvoie un `code` stable (`sold_out`...). Le texte est le nôtre, dans la langue du visiteur. Le `message` anglais de l'API n'est jamais montré aux utilisateurs.

**Ce qui n'est pas traduit, volontairement.** Les titres et descriptions des événements viennent de Paris Data en français. Traduire automatiquement un texte tiers risquerait de fausser des informations (dates, prix) : nous l'affichons tel que publié et le marquons `lang="fr"` pour que les lecteurs d'écran le prononcent correctement. Le pied de page le précise.

**Coût.** Ajouter une troisième langue demande un fichier de messages de plus et une entrée de plus dans `LANGS`. Les langues s'écrivant de droite à gauche demanderaient aussi un travail de mise en page.

## 12. Design visuel issu de Google Stitch, reconstruit en composants

**Choix.** Le premier rendu (papier crème, accent rouge, liste à filets) a été remplacé par une maquette générée dans Google Stitch à partir d'un cahier des charges écrit : page porcelaine, cartes blanches avec images de couverture, un seul accent cobalt, un titre en empattement et une carte qui reste visible.

**Comment nous l'avons utilisée.** Stitch produit un seul fichier HTML stylé avec Tailwind. Nous ne l'avons pas collé tel quel. Nous avons gardé le rendu et l'avons reconstruit en composants React typés sur nos variables de design : des briques `ui/` (`Button`, `Chip`, `Segmented`, `Switch`, `Badge`, `StateMessage`, `Icon`) et des dossiers par fonctionnalité. Le sélecteur de langue et le filtre de date partagent le même composant `Segmented` : une seule implémentation de « choisir une option ».

**Ce que nous avons volontairement retiré de la maquette.** Une navigation avec des pages qui n'existent pas, un bouton de lettre d'information, une icône de compte, un bouton favori, un export `.ics`, un faux indicateur « en direct » et une note de rédaction inventée. Afficher des boutons qui ne font rien serait malhonnête dans une démo. Ce sont des idées, pas des fonctions livrées.

**Le pied de page.** Trois colonnes simples : la marque, les sources de données (liens réels vers Paris Data et OpenStreetMap), et une note honnête sur la démo (capacités fictives) avec le lien vers le code.

**Le bouton « Carte / Liste ».** Sur petit écran (moins de 900 px), la liste et la carte ne tiennent pas côte à côte. Un bouton flottant bascule de l'une à l'autre. Il est masqué sur grand écran.

**Coût.** Tailwind n'a pas été adopté : le design a dû être traduit à la main en variables et classes. En échange, le dépôt n'a aucune dépendance de construction pour le CSS et les styles de chaque composant sont à côté de lui.
