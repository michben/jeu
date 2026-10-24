// Colle ici la configuration de ton projet Firebase :
// console.firebase.google.com → ton projet → ⚙ Paramètres du projet → Vos applications → </> Web → « Configuration ».
// Ces valeurs ne sont pas secrètes : la sécurité vient des règles de firestore.rules.
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCvVPkjq9TZtwDPag2OTDducv4S4pJJbA0",
  authDomain: "jeu-edalam.firebaseapp.com",
  projectId: "jeu-edalam",
  storageBucket: "jeu-edalam.firebasestorage.app",
  messagingSenderId: "741830060458",
  appId: "1:741830060458:web:bc76c1347bc5ce7f2063d3",
  measurementId: "G-L9TYSBT4QE"
};

// Comptes qui ont accès à la console admin (email vérifié obligatoire).
// Mets la même liste dans firestore.rules.
export const ADMIN_EMAILS = ["sospchs@gmail.com"];
