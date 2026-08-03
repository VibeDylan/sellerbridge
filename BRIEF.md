# Brief projet — SellerBridge

Ce document rassemble le brief tel qu'il a été donné, chantier par chantier. Il décrit l'**intention et les critères de réussite** d'origine — pour l'état réel de ce qui est construit, voir les READMEs ([racine](README.md), [`seller-service`](apps/seller-service/README.md), [`kyb-service`](apps/kyb-service/README.md), [`analytics-sink`](apps/analytics-sink/README.md)).

## Contexte

SellerBridge : une plateforme d'onboarding et de vérification de vendeurs pour une marketplace — inscription, puis KYB (Know Your Business), avant de pouvoir vendre. Le projet sert de démonstration de compétences (architecture microservices, event-driven, CQRS, résilience, pipeline data) dans une optique d'entretien technique.

## Semaine 1 — `seller-service`

**Gabarit CQRS de base.** Un module `sellers/` avec `models/`, `repository/`, `commands/`, `queries/`, `dto/` — le repository caché derrière `save()`/`findById()`, une command "quasi vide" (propriétés en lecture seule), un handler qui génère l'id et sauvegarde, un controller sous les 30 lignes sans logique métier. Ce gabarit est explicitement fait pour être reproduit pour le module KYB, puis pour `kyb-service` en entier.
**Critère** : `curl POST` crée un vendeur et renvoie son id, `curl GET` avec cet id renvoie le vendeur complet.

**Chantier B — MongoDB (~4h).** Installer `@nestjs/mongoose` + `mongoose`, connexion via variable d'environnement (avec authentification), schéma Mongoose pour `Seller`, réécriture du repository uniquement.
**Critère** : les handlers, la command, la query et le controller ne changent pas d'une ligne ; les données survivent à un redémarrage du service.

**Chantier C — Tests + CI (~4h).** Tests unitaires Jest sur les deux handlers (repository mocké), test d'intégration sur le controller, premier workflow GitHub Actions (install pnpm, lint, tests, à chaque push et PR).

## Semaine 2 — Event-driven

**Kafka, jour 1.** Ajouter Redpanda (compatible Kafka, un seul conteneur, pas de Zookeeper) + sa console web au `docker-compose.yml`. Faire publier `seller.registered` par `RegisterSellerHandler` via `kafkajs` directement (pas encore l'abstraction `@nestjs/microservices`, pour bien comprendre ce qu'elle cache).
**Critère** : un `curl POST` fait apparaître le message `seller.registered` dans la console Redpanda.

**Créer `kyb-service` et le rendre consommateur.** Générer le service comme `seller-service`. Le faire rejoindre un consumer group explicite (`kyb-service`), s'abonner à `seller.registered`, et pour chaque message : un `console.log` du vendeur reçu (rien de plus pour cette première boucle).
**Critère** : un `POST` sur `seller-service` fait apparaître le vendeur dans les logs de `kyb-service`. Puis vérifier le découplage en vrai : éteindre `kyb-service`, faire deux `POST`, le rallumer — les messages attendaient dans le topic.

**Donner un cerveau à `kyb-service`.** Structure CQRS propre au module `kyb` : modèle `KybCase` (id, sellerId, statut, dates), schéma Mongoose, une base Mongo séparée (même conteneur, base logique distincte — "database per service"). Le consumer dispatche une `OpenKybCaseCommand` au lieu de logger ; le handler crée le dossier via un repository. **Idempotence dès le départ** : vérifier qu'un dossier n'existe pas déjà pour ce `sellerId` avant d'en créer un, pour qu'un rejeu d'event ne crée jamais de doublon.
**Critère** : un `POST` sur `seller-service` fait apparaître un dossier `PENDING` côté `kyb-service`, sans appel HTTP entre les deux services ; un rejeu ne duplique rien.

**Fermer la boucle de la saga.** `ReviewKybCommand` fait passer un dossier de `PENDING` à `APPROVED`/`REJECTED`, déclenchée par un endpoint HTTP `POST /kyb/:id/review` (l'écran opérateur, ici un `curl`). Une fois le dossier revu, `kyb-service` publie `kyb.reviewed` (`sellerId` + verdict) sur un nouveau topic. `seller-service` devient à son tour consommateur de `kyb.reviewed` et met à jour un champ `kybStatus` sur le vendeur.
**Critère** : `POST /sellers` → `GET` montre `kybStatus: PENDING` → `POST /kyb/:id/review` (`APPROVED`) → un nouveau `GET` montre `kybStatus: APPROVED`, tout seul.

## Semaine 2, fin — deux briques finales

**Brique 1 — Robustesse (Dead Letter Topic).** Sans ça, un event qui fait planter un handler est rejoué à l'infini par `kafkajs`, bloquant toute la consommation derrière lui. Pattern DLT : après N tentatives ratées (compteur dans les headers du message), publier dans un topic dédié `xxx.dlt` et continuer.
**Critère** : forcer volontairement une exception dans un handler et voir le message atterrir dans le `.dlt` après quelques essais, au lieu de tourner en boucle.

**Brique 2 — Le pont vers la Data (BigQuery).** Un `analytics-sink` : un petit consumer qui écoute les topics et écrit chaque event dans BigQuery (compte GCP free tier, dataset, tables). Puis 2-3 requêtes SQL : taux d'approbation KYB, délai moyen entre inscription et review, nombre d'inscriptions par jour — le "dataset performant pour les équipes Data" de la fiche de poste.

## Après le backend

Le backend (trois services, event-driven, résilient, avec un pipeline analytics) est le socle. La suite prévue : le front.
