# Mise en ligne sur Vercel

Ce guide met toute la plateforme en ligne : le site, l'API et la base de données. Comptez 15 minutes.

## Ce qui tourne où

```mermaid
flowchart LR
    U([Navigateur]) --> V[Vercel]
    V -->|fichiers statiques| S[Site React<br/>frontend/dist]
    V -->|/api/*| F[Fonction Python<br/>api/index.py = FastAPI]
    F -->|SQL, TLS| C[(CockroachDB Cloud)]
    L[Votre ordinateur<br/>python -m app.ingest] -->|import des événements| C
    L -->|HTTP| P[(Paris Data)]
```

| Élément | Où | Pourquoi |
|---|---|---|
| Site React | Vercel (fichiers statiques) | Gratuit, rapide, servi par un CDN. |
| API FastAPI | Vercel (fonction serverless Python) | Même adresse que le site : pas de CORS, comme avec nginx en local. |
| Base de données | **CockroachDB Cloud** (essai gratuit, voir les limites) | Vercel ne fournit pas de base de données. Nous gardons CockroachDB, donc les mêmes garanties de réservation. |
| Import des événements | Votre ordinateur, une fois | Une fonction serverless est limitée dans le temps. L'import dure environ 30 secondes et se relance à volonté. |

## Ce qui change en production

Une fonction serverless « s'endort » entre deux requêtes et peut se réveiller sur une autre boucle d'événements. Un pool de connexions de longue durée y est donc fragile. En production, l'API utilise le mode **`direct`** : chaque requête ouvre sa propre connexion courte, puis la ferme.

- Le code de réservation **ne change pas** : mêmes transactions sérialisables, même nouvelle tentative.
- Un test le prouve : `backend/tests/test_direct_mode.py` rejoue la course « 50 personnes pour 10 places » avec ce mode (10 gagnantes, 40 refusées).
- Le coût : une poignée de main de connexion par requête (quelques dizaines de millisecondes).

Le mode se règle avec la variable `SORTIR_POOL_MODE`. `api/index.py` la met à `direct` automatiquement sur Vercel.

## Étape 1. Créer la base CockroachDB Cloud

Liens utiles :
- Créer un compte : <https://cockroachlabs.cloud/signup>
- Console : <https://cockroachlabs.cloud>
- Guide de démarrage officiel : <https://docs.cockroachlabs.com/docs/cockroachcloud/quickstart>
- Se connecter à un cluster Basic : <https://docs.cockroachlabs.com/docs/cockroachcloud/connect-to-a-basic-cluster>
- Essai gratuit et facturation : <https://docs.cockroachlabs.com/docs/cockroachcloud/free-trial>

**1.1 Créer le compte et le cluster**

1. Inscrivez-vous (e-mail, GitHub ou Google). Votre première organisation reçoit **400 $ de crédits d'essai**.
2. Sur la page **Get Started**, cliquez sur **Create cluster**.
3. Choisissez un plan. **Basic** est le moins cher et suffit pour la démonstration. Le quickstart officiel montre aussi **Standard** : les deux utilisent les mêmes crédits.
4. Choisissez le fournisseur (AWS ou GCP) et **une région proche de celle de vos fonctions Vercel** (par exemple Paris ou Francfort si disponible, sinon Irlande). Plus la base est proche, plus l'API est rapide.
5. Donnez un nom au cluster, puis **Create cluster**.

**1.2 Créer l'utilisateur SQL**

1. Dans la fenêtre **Create SQL user**, gardez le nom proposé ou choisissez-en un.
2. Cliquez sur **Generate & save password** et **copiez le mot de passe tout de suite** : il n'est affiché qu'une fois. Rangez-le dans un gestionnaire de mots de passe.

**1.3 Récupérer l'adresse de connexion**

1. Sur la page du cluster, cliquez sur **Connect** (en haut à droite).
2. Choisissez **General connection string**, puis copiez l'adresse. Elle ressemble à :

   ```
   postgresql://utilisateur:mot-de-passe@xxxx.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full
   ```

3. Si le mot de passe contient des caractères spéciaux, encodez-les (`!` devient `%21`, `@` devient `%40`).

**1.4 Télécharger le certificat du cluster**

Le serveur est vérifié avec le certificat de l'autorité (CA) du cluster. Ce n'est pas un secret.

1. Dans la même fenêtre **Connect**, ouvrez la section **Download CA Cert**.
2. Téléchargez le certificat. La console propose une commande par système, qui l'enregistre dans le dossier PostgreSQL par défaut (`root.crt`). Vous pouvez aussi ouvrir l'adresse du certificat que la commande contient, dans votre navigateur.
3. Copiez le fichier dans le projet, avec ce nom exact :

   ```
   backend/app/certs/cockroach-ca.crt
   ```

L'application le détecte toute seule : aucune variable à régler. Le fichier est public, vous pouvez le committer. Sur Vercel il est embarqué avec le code.

**1.5 Où ranger l'adresse (le mot de passe est dedans)**

Mettez-la dans `backend/.env`, fichier ignoré par git :

```
SORTIR_DATABASE_URL=postgresql://utilisateur:mot-de-passe@xxxx.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full
```

Ne la collez jamais dans le code, dans un message ou dans git.

## Étape 2. Importer les événements dans cette base

Depuis votre ordinateur (une seule fois, puis quand vous voulez rafraîchir) :

```bash
cd backend
# L'adresse est lue dans backend/.env (étape 1.5)
uv run python -m app.ingest
```

La commande crée aussi les tables. Elle affiche le nombre d'événements importés (environ 2 900).

## Étape 3. Déployer sur Vercel

**Depuis le site de Vercel (le plus simple)**

1. Allez sur [vercel.com/new](https://vercel.com/new) et importez le dépôt GitHub.
2. Laissez **Root Directory** à la racine du dépôt. Vercel lit `vercel.json` : il construit le frontend et déclare la fonction `api/index.py`.
3. Dans **Environment Variables**, ajoutez `SORTIR_DATABASE_URL` avec l'adresse de l'étape 1.
4. Cliquez sur **Deploy**.

**Ou en ligne de commande**

```bash
npm install -g vercel
vercel login
vercel link
vercel env add SORTIR_DATABASE_URL production     # collez l'adresse quand on vous la demande
vercel deploy --prod
```

## Étape 4. Vérifier

Remplacez `votre-site` par l'adresse donnée par Vercel :

```bash
curl https://votre-site.vercel.app/api/health
# {"status":"ok","tx_retries":0}
```

Puis ouvrez le site : la liste, la carte, les filtres, la pagination et une réservation doivent fonctionner.

## En cas de problème

| Symptôme | Cause probable | Solution |
|---|---|---|
| `/api/health` répond 500 | L'adresse de la base est absente ou fausse | Vérifiez `SORTIR_DATABASE_URL` dans les variables d'environnement, puis redéployez. |
| Erreur de certificat SSL (`root certificate file does not exist` ou `certificate verify failed`) | Le certificat du cluster n'est pas dans le projet | Refaites l'étape 1.4 : le fichier doit être `backend/app/certs/cockroach-ca.crt`, puis redéployez. |
| `password authentication failed` | Mot de passe faux ou mal encodé | Réinitialisez le mot de passe dans la console, encodez les caractères spéciaux. |
| Le site s'affiche mais la liste est vide | L'import n'a pas été fait sur cette base | Relancez l'étape 2 avec la même adresse. |
| `relation "events" does not exist` | Les tables n'existent pas | L'étape 2 les crée : lancez-la. |
| Première requête lente après une pause | Démarrage à froid de la fonction | Normal avec une fonction serverless. Les suivantes sont rapides. |

## Limites honnêtes

- **Ce n'est pas gratuit pour toujours.** Une nouvelle organisation reçoit 400 $ de crédits d'essai. Un cluster Basic profite ensuite d'un crédit mensuel de 15 $ (environ 50 millions d'unités de requêtes et 10 Gio de stockage), mais **seulement si une carte bancaire est enregistrée**. Sans carte, à la fin de l'essai les clusters sont ralentis pendant 30 jours, puis **supprimés sans retour possible**. Pour une démonstration d'entretien, l'essai suffit : pensez à ajouter une carte, ou à exporter les données, avant la fin. Source : [free-trial](https://docs.cockroachlabs.com/docs/cockroachcloud/free-trial).
- La base se recrée facilement : `uv run python -m app.ingest` recharge tout en 30 secondes. Seules les réservations de démonstration seraient perdues.
- Je n'ai pas mesuré les performances sur Vercel : la démonstration de concurrence a été mesurée en local (voir le README).
- L'import est manuel. Pour le planifier : une tâche GitHub Actions avec `schedule`, qui lance `python -m app.ingest` avec l'adresse de la base en secret.
