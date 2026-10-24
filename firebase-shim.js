// Connexion Firebase pour la version GitHub du jeu.
// Ce module fournit au jeu la même interface que dans Claude (window.claude.use("db" | "user" | "downloads")),
// branchée sur Firebase Authentication et Cloud Firestore.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, collection, getDoc, setDoc, deleteDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { FIREBASE_CONFIG, ADMIN_EMAILS } from "./firebase-config.js";

const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- Écran de connexion ---------- */
const css = `
#authOv{position:fixed;inset:0;z-index:50;background:var(--bg,#100F0C);display:flex;justify-content:center;overflow-y:auto;
  padding:max(20px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) max(20px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}
#authOv .box{width:100%;max-width:420px;display:flex;flex-direction:column;gap:14px;margin:auto 0}
#authOv .cov{width:150px;aspect-ratio:1/1;border:1px solid var(--rule2,#665536);overflow:hidden;align-self:center}
#authOv .cov img{width:100%;height:100%;object-fit:cover;display:block}
#authOv .atab{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--rule2,#665536)}
#authOv .atab button{padding:11px;font:400 11px/1 var(--mono,monospace);letter-spacing:.15em;text-transform:uppercase;color:var(--muted,#BEB6A4)}
#authOv .atab button[aria-selected="true"]{background:var(--gold,#E8BC60);color:var(--bg,#100F0C)}
#authOv .google{display:flex;align-items:center;justify-content:center;gap:10px;border:1px solid var(--rule2,#665536);padding:13px;font:400 12px/1 var(--mono,monospace);letter-spacing:.1em;text-transform:uppercase;color:var(--ink,#F5EEDC)}
#authOv .google:hover{border-color:var(--gold,#E8BC60)}
#authOv .or{display:flex;align-items:center;gap:10px;font:400 10px/1 var(--mono,monospace);color:var(--dim,#7d745f);letter-spacing:.2em}
#authOv .or::before,#authOv .or::after{content:"";flex:1;height:1px;background:var(--rule2,#665536)}
#authOv .link{font:400 11px/1.4 var(--mono,monospace);color:var(--muted,#BEB6A4);text-decoration:underline;align-self:center}
#authOv .msg{font:400 12px/1.5 var(--mono,monospace);min-height:18px;color:var(--bad,#E07A5F)}
#authOv .msg.ok{color:var(--ok,#9FCB7A)}
`;
function overlay(html) {
  let ov = document.getElementById("authOv");
  if (!ov) {
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    ov = document.createElement("div"); ov.id = "authOv"; document.body.appendChild(ov);
  }
  ov.innerHTML = `<div class="box"><div class="cov"><img src="cover.jpg" alt="Pochette du morceau Concentré d'Edalam"></div>${html}</div>`;
  return ov;
}
const hideOverlay = () => { const ov = document.getElementById("authOv"); if (ov) ov.remove(); };

const AUTH_ERR = {
  "auth/invalid-credential": "Email ou mot de passe incorrect.",
  "auth/wrong-password": "Email ou mot de passe incorrect.",
  "auth/user-not-found": "Aucun compte avec cet email. Crée un compte.",
  "auth/email-already-in-use": "Un compte existe déjà avec cet email. Connecte-toi.",
  "auth/weak-password": "Le mot de passe doit faire au moins 6 caractères.",
  "auth/invalid-email": "Cet email n'est pas valide.",
  "auth/missing-password": "Entre ton mot de passe.",
  "auth/too-many-requests": "Trop d'essais. Attends quelques minutes puis réessaie.",
  "auth/network-request-failed": "Pas de connexion internet. Vérifie ta connexion puis réessaie.",
  "auth/popup-closed-by-user": "Fenêtre Google fermée avant la fin. Réessaie.",
  "auth/popup-blocked": "Ton navigateur a bloqué la fenêtre Google. Autorise les pop-ups pour ce site.",
  "auth/unauthorized-domain": "Ce site n'est pas encore autorisé dans Firebase (Authentication → Paramètres → Domaines autorisés)."
};
const authMsg = e => AUTH_ERR[e && e.code] || "La connexion a échoué. Réessaie dans un instant.";

function showSetup() {
  overlay(`<h1 class="hook">Configuration <em>Firebase</em> manquante</h1>
    <p class="lede">Ouvre <b>firebase-config.js</b> et colle la configuration de ton projet Firebase. Les étapes sont dans le README du dépôt.</p>`);
}

function showAuth(auth, mode = "login") {
  const isNew = mode === "signup";
  const ov = overlay(`
    <span class="eyebrow">Edalam · Concentré</span>
    <h1 class="hook">${isNew ? "Crée ton <em>compte</em>" : "Connecte-<em>toi</em>"}</h1>
    <p class="lede">Un compte est obligatoire pour jouer, garder tes scores et entrer au classement.</p>
    <div class="atab" role="tablist">
      <button type="button" role="tab" data-m="login" aria-selected="${!isNew}">Se connecter</button>
      <button type="button" role="tab" data-m="signup" aria-selected="${isNew}">Créer un compte</button>
    </div>
    <button class="google" type="button" id="gBtn"><span aria-hidden="true">G</span> Continuer avec Google</button>
    <div class="or">OU</div>
    <form id="aForm" novalidate style="display:flex;flex-direction:column;gap:12px">
      <div class="field"><label for="aEmail">Email</label><input type="email" id="aEmail" autocomplete="email" required></div>
      <div class="field"><label for="aPass">Mot de passe <span>${isNew ? "6 caractères minimum" : ""}</span></label><input type="password" id="aPass" autocomplete="${isNew ? "new-password" : "current-password"}" required style="background:var(--panel);border:1px solid var(--rule2);padding:12px;font:400 18px/1.2 var(--display);color:var(--ink);width:100%"></div>
      <div class="msg" id="aMsg" role="alert"></div>
      <button class="cta" type="submit" id="aSubmit">${isNew ? "Créer mon compte" : "Se connecter"}</button>
    </form>
    ${isNew ? "" : `<button class="link" type="button" id="aReset">Mot de passe oublié ?</button>`}
  `);
  ov.querySelectorAll(".atab button").forEach(b => b.onclick = () => showAuth(auth, b.dataset.m));
  const msg = ov.querySelector("#aMsg");
  ov.querySelector("#gBtn").onclick = async () => {
    msg.className = "msg"; msg.textContent = "";
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (e) { msg.textContent = authMsg(e); }
  };
  ov.querySelector("#aForm").onsubmit = async e => {
    e.preventDefault();
    const email = ov.querySelector("#aEmail").value.trim(), pass = ov.querySelector("#aPass").value, btn = ov.querySelector("#aSubmit");
    msg.className = "msg"; msg.textContent = "";
    if (!email) { msg.textContent = "Entre ton email."; return; }
    btn.disabled = true;
    try {
      if (isNew) { const c = await createUserWithEmailAndPassword(auth, email, pass); try { await sendEmailVerification(c.user); } catch (_) {} }
      else await signInWithEmailAndPassword(auth, email, pass);
    } catch (x) { msg.textContent = authMsg(x); btn.disabled = false; }
  };
  const rs = ov.querySelector("#aReset");
  if (rs) rs.onclick = async () => {
    const email = ov.querySelector("#aEmail").value.trim();
    if (!email) { msg.className = "msg"; msg.textContent = "Entre ton email ci-dessus, puis clique à nouveau sur « Mot de passe oublié ? »."; return; }
    try { await sendPasswordResetEmail(auth, email); msg.className = "msg ok"; msg.textContent = "Email de réinitialisation envoyé. Regarde ta boîte mail."; }
    catch (x) { msg.className = "msg"; msg.textContent = authMsg(x); }
  };
}

/* ---------- Adaptateur base de données ---------- */
function wrapDoc(s) { const ex = s.exists(); return { id: s.id, exists: ex, data: () => (ex ? s.data() : undefined), metadata: { fromCache: s.metadata.fromCache, hasPendingWrites: s.metadata.hasPendingWrites } }; }
function dbErr(e) { const c = e && e.code; return { code: c === "permission-denied" ? "invalid_argument" : c === "resource-exhausted" ? "quota_exceeded" : "unavailable", message: (e && e.message) || "" }; }
function makeDb(fs) {
  const fail = e => { throw dbErr(e); };
  function docRef(path) {
    const r = doc(fs, path);
    return {
      id: r.id, path,
      get: async () => wrapDoc(await getDoc(r).catch(fail)),
      set: d => setDoc(r, d).catch(fail),
      update: d => setDoc(r, d, { merge: true }).catch(fail),   // fusion des objets imbriqués, comme dans Claude
      delete: () => deleteDoc(r).catch(fail),
      onSnapshot: (next, error) => onSnapshot(r, s => next(wrapDoc(s)), x => error && error(dbErr(x))),
      collection: p => colRef(path + "/" + p)
    };
  }
  function colRef(path) {
    const c = collection(fs, path);
    return {
      path,
      doc: id => docRef(path + "/" + (id || doc(c).id)),
      add: async d => { const r = docRef(path + "/" + doc(c).id); await r.set(d); return r; },
      onSnapshot: (next, error) => onSnapshot(c, s => { const docs = s.docs.map(wrapDoc); next({ docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }); }, x => error && error(dbErr(x)))
    };
  }
  return { doc: docRef, collection: colRef };
}
const downloads = {
  save: async ({ filename, data }) => {
    const blob = data instanceof Blob ? data : new Blob([data]);
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
};

/* ---------- Démarrage ---------- */
const configured = FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && !/^REMPLACE/.test(FIREBASE_CONFIG.apiKey);
if (!configured) showSetup();
else {
  const app = initializeApp(FIREBASE_CONFIG), auth = getAuth(app), fs = getFirestore(app), db = makeDb(fs);
  auth.languageCode = "fr";
  let started = null;
  onAuthStateChanged(auth, async u => {
    if (!u) { if (started) { location.reload(); return; } showAuth(auth); return; }
    if (started && started !== u.uid) { location.reload(); return; }
    if (started) return;
    started = u.uid;
    const email = (u.email || "").toLowerCase();
    let admin = !!u.emailVerified && ADMIN_EMAILS.map(x => x.toLowerCase()).includes(email);
    if (!admin) { try { admin = (await getDoc(doc(fs, "admins/" + u.uid))).exists(); } catch (_) {} }
    // Trace chaque compte pour que l'admin voie aussi ceux qui n'ont pas fini leur profil joueur.
    try {
      const ref = doc(fs, "accounts/" + u.uid), prev = await getDoc(ref), now = Date.now();
      const prov = (u.providerData[0] && u.providerData[0].providerId) || "password";
      await setDoc(ref, { email: u.email || "", provider: prov, verified: !!u.emailVerified, lastLogin: now, ...(prev.exists() ? {} : { createdAt: now }) }, { merge: true });
    } catch (_) { window.__rulesMissing = true; }
    hideOverlay();
    const user = {
      id: async () => u.uid, canEdit: async () => admin, isOwner: async () => admin, can: async () => true,
      me: async () => ({ id: u.uid, name: u.displayName || "", email: u.email, avatarUrl: "", color: "#E8BC60", isOwner: admin, canEdit: admin })
    };
    const api = {
      use: async n => (n === "db" ? db : n === "user" ? user : n === "downloads" ? downloads : null),
      auth: { email: u.email, verified: u.emailVerified, signOut: async () => { await signOut(auth); } }
    };
    window.claude = api;
    if (window.__shimResolve) window.__shimResolve(api);
  });
}
