// Colle ici la configuration de ton projet Firebase :
// console.firebase.google.com → ton projet → ⚙ Paramètres du projet → Vos applications → </> Web → « Configuration ».
// Ces valeurs ne sont pas secrètes : la sécurité vient des règles de firestore.rules.
export const FIREBASE_CONFIG = {
  apiKey: "REMPLACE_PAR_TA_CLE",
  authDomain: "ton-projet.firebaseapp.com",
  projectId: "ton-projet",
  storageBucket: "ton-projet.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000"
};

// Comptes qui ont accès à la console admin (email vérifié obligatoire).
// Mets la même liste dans firestore.rules.
export const ADMIN_EMAILS = ["sospchs@gmail.com"];
