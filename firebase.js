// ═══════════════════════════════════════════
// firebase.js — Inicialización de Firebase
// ═══════════════════════════════════════════
// 🔧 CONFIGURA AQUÍ TU PROYECTO DE FIREBASE
// Ve a: https://console.firebase.google.com
// Proyecto → Configuración → Tu aplicación web
// Copia el objeto firebaseConfig y pégalo abajo.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ──────────────────────────────────────────
//  ⚠️  REEMPLAZA ESTOS VALORES CON LOS TUYOS
// ──────────────────────────────────────────
const firebaseConfig = {

  apiKey: "AIzaSyADLCzoVrAAjlDWeYCe9pbb7Inpqcz2Xhc",

  authDomain: "control-carne-buffet.firebaseapp.com",

  projectId: "control-carne-buffet",

  storageBucket: "control-carne-buffet.firebasestorage.app",

  messagingSenderId: "201929025702",

  appId: "1:201929025702:web:2d9a15166f0b5b9492ac67",

  measurementId: "G-PW4S7DPZV9"

};

let db = null;
let firebaseReady = false;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);

  // Habilita persistencia offline (funciona sin internet)
  enableIndexedDbPersistence(db)
    .then(() => console.log("✅ Persistencia offline activada"))
    .catch(err => {
      if (err.code === 'failed-precondition') {
        console.warn("Persistencia: múltiples pestañas abiertas");
      } else if (err.code === 'unimplemented') {
        console.warn("Persistencia: navegador no soportado");
      }
    });

  firebaseReady = true;
  console.log("✅ Firebase inicializado");
} catch (e) {
  console.warn("⚠️ Firebase no configurado. Modo local activado.", e.message);
  firebaseReady = false;
}

// ── GUARDAR CICLO ────────────────────────
async function guardarCiclo(ciclo) {
  if (!firebaseReady || !db) {
    // Guardar en localStorage como fallback
    const local = JSON.parse(localStorage.getItem("ciclos_local") || "[]");
    ciclo.id = "local_" + Date.now();
    local.push(ciclo);
    localStorage.setItem("ciclos_local", JSON.stringify(local));
    return { id: ciclo.id, local: true };
  }

  try {
    const docRef = await addDoc(collection(db, "ciclos"), {
      ...ciclo,
      fecha: Timestamp.fromDate(new Date(ciclo.fecha))
    });
    console.log("✅ Ciclo guardado:", docRef.id);
    return { id: docRef.id, local: false };
  } catch (e) {
    console.error("Error Firestore:", e);
    // Fallback a local si falla
    const local = JSON.parse(localStorage.getItem("ciclos_local") || "[]");
    ciclo.id = "local_" + Date.now();
    local.push(ciclo);
    localStorage.setItem("ciclos_local", JSON.stringify(local));
    return { id: ciclo.id, local: true };
  }
}

// ── OBTENER CICLOS DEL DÍA ───────────────
async function obtenerCiclosHoy() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  // Combinar datos locales y remotos
  let ciclos = [];

  // Datos locales
  const local = JSON.parse(localStorage.getItem("ciclos_local") || "[]");
  const localHoy = local.filter(c => {
    const f = new Date(c.fecha);
    return f >= hoy && f < manana;
  });
  ciclos = [...localHoy];

  if (!firebaseReady || !db) return ciclos;

  try {
    const q = query(
      collection(db, "ciclos"),
      where("fecha", ">=", Timestamp.fromDate(hoy)),
      where("fecha", "<", Timestamp.fromDate(manana)),
      orderBy("fecha", "desc")
    );
    const snap = await getDocs(q);
    const remotos = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      fecha: d.data().fecha.toDate().toISOString()
    }));
    // Merge evitando duplicados por id
    const ids = new Set(ciclos.map(c => c.id));
    remotos.forEach(c => { if (!ids.has(c.id)) ciclos.push(c); });
    return ciclos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  } catch (e) {
    console.warn("Error leyendo Firestore:", e);
    return ciclos;
  }
}

// Exportar al scope global para uso desde app.js (no-module)
window.FirebaseDB = { guardarCiclo, obtenerCiclosHoy, firebaseReady };
