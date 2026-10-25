# Certificat de CockroachDB Cloud

Pour une base CockroachDB Cloud, déposez ici le certificat de l'autorité (CA) de votre cluster sous le nom
`cockroach-ca.crt`. Ce n'est pas un secret : c'est un certificat public. L'application l'utilise
automatiquement pour vérifier le serveur (`sslmode=verify-full`).

Où le télécharger : console CockroachDB Cloud, votre cluster, bouton **Connect**, option
**General connection string**, section **Download CA Cert**. Voir `docs/DEPLOIEMENT.md`.

Sans ce fichier (base locale en Docker, tests), rien ne change.
