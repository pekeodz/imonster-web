// Optional Firebase cloud save. Fill js/firebase-config.js to enable.
// Uses Firebase Auth (anonymous) + Firestore: document  saves/{uid}
import { FIREBASE_CONFIG } from '../firebase-config.js';

const V = '10.12.2';
let fb = null, user = null, pending = null, timer = null;

export const Cloud = {
  enabled: !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey),
  status: 'off',
  async init() {
    if (!this.enabled) return false;
    try {
      const app = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
      const auth = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
      const fs = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);
      const a = app.initializeApp(FIREBASE_CONFIG);
      const au = auth.getAuth(a);
      const db = fs.getFirestore(a);
      fb = { auth, fs, au, db };
      user = au.currentUser || (await new Promise(res => { const off = auth.onAuthStateChanged(au, u => { off(); res(u); }); }));
      if (!user) user = (await auth.signInAnonymously(au)).user;
      this.status = 'ok';
      return true;
    } catch (e) { console.warn('Firebase disabled:', e); this.status = 'error'; this.enabled = false; return false; }
  },
  get uid() { return user?.uid; },
  async load() {
    if (!this.enabled || !fb) return null;
    const snap = await fb.fs.getDoc(fb.fs.doc(fb.db, 'saves', user.uid));
    return snap.exists() ? JSON.parse(snap.data().json) : null;
  },
  save(data) {
    if (!this.enabled || !fb) return;
    pending = data;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const d = pending; pending = null;
      try { await fb.fs.setDoc(fb.fs.doc(fb.db, 'saves', user.uid), { json: JSON.stringify(d), updated: d.updated, name: d.name, level: d.level, maxFloor: d.maxFloor }); this.status = 'ok'; }
      catch (e) { console.warn('cloud save failed', e); this.status = 'error'; }
    }, 1500);
  },
  // link anonymous account with Google so the save follows the user across devices
  async signInGoogle() {
    if (!fb) return false;
    const prov = new fb.auth.GoogleAuthProvider();
    try {
      if (user && user.isAnonymous) { const r = await fb.auth.linkWithPopup(user, prov); user = r.user; }
      else { const r = await fb.auth.signInWithPopup(fb.au, prov); user = r.user; }
      return true;
    } catch (e) {
      if (e.code === 'auth/credential-already-in-use') {
        const cred = fb.auth.GoogleAuthProvider.credentialFromError(e);
        const r = await fb.auth.signInWithCredential(fb.au, cred); user = r.user; return true;
      }
      console.warn(e); return false;
    }
  },
  get isAnon() { return !user || user.isAnonymous; },
};
