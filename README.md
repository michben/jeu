# Défis Concentré — Edalam

Six jeux de concentration autour du morceau **Concentré** d'Edalam, avec comptes joueurs, classements, mini radio et console admin.

| Défi | Principe |
|---|---|
| Tu l'as vraiment vu ? | 8 manches : retiens une liste de mots, déjoue les pièges |
| Dis la couleur | 10 mots : donne la couleur de l'encre, pas le mot |
| Un objet a disparu | 5 grilles de 6 à 12 objets : trouve celui qui manque |
| Pause au bon moment | 12 chances : fige la pochette quand elle est reconstituée |
| Question d'angle | 5 sculptures 3D : trouve l'angle qui révèle le mot |
| Sons à l'envers | Reconnais un son joué à l'envers (sons gérés dans la console) |

Le site est statique (HTML, CSS, JavaScript). Les comptes et les données passent par **Firebase** (offre gratuite « Spark »).

## Mise en ligne (environ 15 minutes)

### 1. Créer le projet Firebase
1. Va sur [console.firebase.google.com](https://console.firebase.google.com) et crée un projet (Google Analytics n'est pas nécessaire).
2. **Authentication** → Commencer → onglet *Mode de connexion* : active **Adresse e-mail/Mot de passe** et **Google**.
3. **Firestore Database** → Créer une base de données → mode production, région `europe-west`.
4. Firestore → onglet **Règles** : remplace le contenu par celui de [`firestore.rules`](firestore.rules), puis **Publier**.
5. ⚙ **Paramètres du projet** → *Vos applications* → icône **</>** (Web) → enregistre l'app → copie l'objet `firebaseConfig`.

### 2. Brancher le jeu
Ouvre [`firebase-config.js`](firebase-config.js) et colle tes valeurs dans `FIREBASE_CONFIG`. Ces valeurs ne sont pas secrètes : la sécurité vient des règles Firestore.

### 3. Publier sur GitHub Pages
1. Dépôt GitHub → **Settings** → **Pages** → *Deploy from a branch* → branche `main`, dossier `/ (root)`.
2. Le site sera à l'adresse `https://michben.github.io/jeu/`.
3. Retour dans Firebase → Authentication → **Paramètres** → *Domaines autorisés* → ajoute `michben.github.io`.

> GitHub Pages sur un dépôt **privé** demande un abonnement GitHub Pro. Sinon, passe le dépôt en public (Settings → General → Danger Zone → Change visibility).

### 4. Ouvrir la console admin
1. Ouvre le site et connecte-toi avec **sospchs@gmail.com** (Google, ou email + mot de passe avec l'email vérifié).
2. Crée ton profil joueur, puis clique sur **Admin** en haut de l'écran (ou ajoute `#admin` à l'adresse).
3. Onglet **Sons à l'envers** → **Installer les 3 sons d'origine**.

Ajouter un autre admin : ajoute son email dans `ADMIN_EMAILS` (firebase-config.js) **et** dans `firestore.rules`, ou crée dans Firestore un document `admins/<son uid>` (l'uid est visible dans Authentication → Utilisateurs).

## Console admin
- **Vue d'ensemble** : inscrits, parties, joueurs actifs, statistiques par défi, dernières parties.
- **Joueurs** : recherche, tri, suspension, remise à zéro des scores, suppression, export CSV.
- **Réglages** : ouverture du jeu et de chaque défi, annonce, pack d'effets sonores, volumes.
- **Sons à l'envers** : 18 réglages de jeu (manches, écoutes, chrono, vitesse, points, bonus, vies…), bibliothèque de sons, import de fichiers audio avec découpe (4 s maximum par son).
- **Radio** : titres affichés dans la radio, avec leur lien Spotify.

## Fichiers
- `index.html` : le jeu complet.
- `firebase-shim.js` : connexion, inscription, déconnexion et accès à Firestore.
- `firebase-config.js` : configuration Firebase et emails admin.
- `firestore.rules` : règles de sécurité de la base.
- `seed/sounds.json` : les 3 sons d'origine de « Sons à l'envers ».
- `three.module.min.js`, `sculpture.js`, `glyphs.js` : la 3D de « Question d'angle ».

## Crédits
Musique et pochette : Edalam — *Concentré*. Three.js (licence MIT, voir `THREE-LICENSE.txt`). Icônes Lucide (licence ISC). Polices Oswald, Space Mono et Barlow (SIL Open Font License).
