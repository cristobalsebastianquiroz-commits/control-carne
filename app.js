// ═══════════════════════════════════════════
// app.js — Lógica principal
// ═══════════════════════════════════════════

/* ── ESTADO GLOBAL ─────────────────────── */
const state = {
  usuario: "",
  kg_ingreso: 0,
  cicloActual: null
};

/* ── TOLERANCIA ────────────────────────── */
function getTolerance() {
  return parseFloat(localStorage.getItem("tolerancia") || "0.5");
}
function guardarTolerancia(val) {
  const v = parseFloat(val);
  if (!isNaN(v) && v > 0) {
    localStorage.setItem("tolerancia", v.toString());
    showToast(`Tolerancia: ${v} kg`, "ok");
  }
}

/* ── NAVEGACIÓN ────────────────────────── */
let currentScreen = "login";

function goTo(screenId) {
  const prev = document.getElementById(`screen-${currentScreen}`);
  const next = document.getElementById(`screen-${screenId}`);
  if (!next) return;

  prev?.classList.remove("active");
  next.classList.add("active");
  currentScreen = screenId;

  // Scroll al top
  next.scrollTop = 0;

  // Autofocus al primer input
  setTimeout(() => {
    const inp = next.querySelector("input");
    // No hacer focus automático en móvil (abre teclado inesperadamente)
  }, 300);
}

/* ── LOGIN ─────────────────────────────── */
function login() {
  const inp = document.getElementById("input-usuario");
  const val = inp.value.trim();
  if (!val) {
    inp.focus();
    inp.classList.add("shake");
    setTimeout(() => inp.classList.remove("shake"), 400);
    showToast("Ingresa tu nombre", "err");
    return;
  }
  state.usuario = val;
  localStorage.setItem("usuario", val);
  document.getElementById("display-usuario").textContent = val.toUpperCase();
  goTo("bodega");
}

function logout() {
  state.usuario = "";
  document.getElementById("input-usuario").value = "";
  goTo("login");
}

/* ── BODEGA ────────────────────────────── */
function iniciarProceso() {
  const val = parseFloat(document.getElementById("input-kg-ingreso").value);
  if (!val || val <= 0) {
    showToast("Ingresa los KG de carne", "err");
    document.getElementById("input-kg-ingreso").focus();
    return;
  }
  if (val > 9999) {
    showToast("Valor muy alto, revisa", "err");
    return;
  }

  state.kg_ingreso = val;
  document.getElementById("display-kg-ingreso").textContent = `${val} kg`;

  // Limpiar cocina
  ["input-kg-util", "input-merma", "input-bolsas"].forEach(id => {
    document.getElementById(id).value = "";
  });
  document.getElementById("cocina-preview").classList.add("hidden");

  goTo("cocina");
}

function volverBodega() {
  goTo("bodega");
}

/* ── COCINA — PREVIEW EN TIEMPO REAL ───── */
function actualizarResumenCocina() {
  const util  = parseFloat(document.getElementById("input-kg-util").value) || 0;
  const merma = parseFloat(document.getElementById("input-merma").value) || 0;
  const bolsas = parseInt(document.getElementById("input-bolsas").value) || 0;

  const bar = document.getElementById("cocina-preview");

  if (util === 0 && merma === 0) {
    bar.classList.add("hidden");
    return;
  }

  const total = util + merma;
  const diff  = total - state.kg_ingreso;
  const tol   = getTolerance();
  const ok    = Math.abs(diff) <= tol;

  document.getElementById("prev-total").textContent = total.toFixed(1) + " kg";
  const diffEl = document.getElementById("prev-diff");
  diffEl.textContent = (diff >= 0 ? "+" : "") + diff.toFixed(2) + " kg";
  diffEl.style.color = ok ? "var(--ok)" : "var(--err)";

  bar.classList.remove("hidden", "ok", "err");
  bar.classList.add(ok ? "ok" : "err");
}

/* ── FINALIZAR CICLO ───────────────────── */
async function finalizarCiclo() {
  const kg_util  = parseFloat(document.getElementById("input-kg-util").value);
  const merma    = parseFloat(document.getElementById("input-merma").value);
  const bolsas   = parseInt(document.getElementById("input-bolsas").value);

  // Validaciones
  if (!kg_util || kg_util <= 0)  { showToast("Ingresa KG útiles", "err"); return; }
  if (isNaN(merma) || merma < 0) { showToast("Ingresa KG merma (puede ser 0)", "err"); return; }
  if (!bolsas || bolsas <= 0)    { showToast("Ingresa número de bolsas", "err"); return; }

  const total_proceso = kg_util + merma;
  const diferencia    = total_proceso - state.kg_ingreso;
  const tol           = getTolerance();
  const ok            = Math.abs(diferencia) <= tol;

  // Calcular resultados
  const cortes      = bolsas * 20;
  const peso_prom   = bolsas > 0 ? (kg_util / bolsas) : 0;
  const merma_pct   = state.kg_ingreso > 0 ? (merma / state.kg_ingreso * 100) : 0;

  const ciclo = {
    fecha:      new Date().toISOString(),
    usuario:    state.usuario,
    kg_ingreso: state.kg_ingreso,
    kg_util:    kg_util,
    merma:      merma,
    bolsas:     bolsas,
    cortes:     cortes,
    diferencia: parseFloat(diferencia.toFixed(3)),
    estado:     ok ? "OK" : "ERROR",
    merma_pct:  parseFloat(merma_pct.toFixed(1))
  };

  state.cicloActual = ciclo;

  // Mostrar resultado
  mostrarResultado(ciclo, ok, diferencia, peso_prom, merma_pct);
  goTo("resultado");

  // Guardar en background
  guardarCicloAsync(ciclo);
}

function mostrarResultado(ciclo, ok, diferencia, peso_prom, merma_pct) {
  const titulo   = document.getElementById("result-estado-titulo");
  const card     = document.getElementById("result-estado-card");
  const icon     = document.getElementById("result-icon");
  const msg      = document.getElementById("result-msg");
  const diffEl   = document.getElementById("result-diff");

  titulo.textContent = ok ? "CUADRA" : "NO CUADRA";
  titulo.className = ok ? "screen-title ok" : "screen-title err";

  card.className = "estado-card " + (ok ? "estado-ok" : "estado-err");
  icon.textContent = ok ? "✓" : "✗";
  msg.textContent  = ok ? "Ciclo correcto" : "Revisar diferencia";
  diffEl.textContent = ok ? "" : `Diferencia: ${diferencia >= 0 ? "+" : ""}${diferencia.toFixed(2)} kg`;

  document.getElementById("res-cortes").textContent     = ciclo.cortes;
  document.getElementById("res-peso-prom").textContent  = peso_prom.toFixed(2) + " kg";
  document.getElementById("res-merma-pct").textContent  = merma_pct.toFixed(1) + "%";
  document.getElementById("res-kg-ingreso").textContent = ciclo.kg_ingreso + " kg";

  // Sync status
  setSyncStatus("pending");
}

async function guardarCicloAsync(ciclo) {
  // Esperar a que firebase.js cargue (es module)
  let intentos = 0;
  while (!window.FirebaseDB && intentos < 20) {
    await new Promise(r => setTimeout(r, 250));
    intentos++;
  }

  try {
    const result = await window.FirebaseDB.guardarCiclo(ciclo);
    if (result.local) {
      setSyncStatus("local");
    } else {
      setSyncStatus("ok");
    }
  } catch (e) {
    setSyncStatus("error");
    console.error("Error guardando:", e);
  }
}

function setSyncStatus(status) {
  const bar  = document.getElementById("sync-status");
  const icon = document.getElementById("sync-icon");
  const text = document.getElementById("sync-text");

  bar.className = "sync-bar";
  switch (status) {
    case "pending":
      bar.classList.add("sync-pending");
      icon.textContent = "⏳"; text.textContent = "Guardando..."; break;
    case "ok":
      bar.classList.add("sync-ok");
      icon.textContent = "☁️"; text.textContent = "Guardado en la nube"; break;
    case "local":
      bar.classList.add("sync-pending");
      icon.textContent = "📱"; text.textContent = "Guardado local (sin internet)"; break;
    case "error":
      bar.classList.add("sync-error");
      icon.textContent = "⚠️"; text.textContent = "Error al guardar — reintenta"; break;
  }
}

/* ── NUEVO CICLO ───────────────────────── */
function nuevoCiclo() {
  document.getElementById("input-kg-ingreso").value = "";
  goTo("bodega");
}

/* ── DASHBOARD ─────────────────────────── */
async function mostrarDashboard() {
  goTo("dashboard");

  const hoy = new Date();
  const opts = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  document.getElementById("dash-fecha").textContent =
    hoy.toLocaleDateString("es-CL", opts).toUpperCase();

  document.getElementById("input-tolerancia").value = getTolerance();

  const list = document.getElementById("ciclos-list");
  list.innerHTML = '<div class="ciclo-empty">Cargando...</div>';

  // Esperar Firebase
  let intentos = 0;
  while (!window.FirebaseDB && intentos < 20) {
    await new Promise(r => setTimeout(r, 250));
    intentos++;
  }

  let ciclos = [];
  try {
    ciclos = await window.FirebaseDB.obtenerCiclosHoy();
  } catch (e) {
    ciclos = JSON.parse(localStorage.getItem("ciclos_local") || "[]");
  }

  if (ciclos.length === 0) {
    list.innerHTML = '<div class="ciclo-empty">Sin ciclos hoy</div>';
    resetDashStats();
    return;
  }

  // Calcular totales
  const totalKg     = ciclos.reduce((s, c) => s + (c.kg_ingreso || 0), 0);
  const totalMerma  = ciclos.reduce((s, c) => s + (c.merma || 0), 0);
  const totalCortes = ciclos.reduce((s, c) => s + (c.cortes || 0), 0);
  const errores     = ciclos.filter(c => c.estado === "ERROR").length;
  const mermaAvg    = totalKg > 0 ? (totalMerma / totalKg * 100) : 0;

  document.getElementById("dash-kg").textContent        = totalKg.toFixed(1) + " kg";
  document.getElementById("dash-merma-pct").textContent = mermaAvg.toFixed(1) + "%";
  document.getElementById("dash-cortes").textContent    = totalCortes;
  document.getElementById("dash-errores").textContent   = errores;

  const errBox = document.getElementById("dash-errores-box");
  if (errores > 0) errBox.classList.add("has-errors");
  else errBox.classList.remove("has-errors");

  // Lista de ciclos
  list.innerHTML = "";
  ciclos.forEach(c => {
    const fecha  = new Date(c.fecha);
    const hora   = fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const ok     = c.estado === "OK";
    const item   = document.createElement("div");
    item.className = `ciclo-item ${ok ? "ok" : "error"}`;
    item.innerHTML = `
      <div>
        <div class="ciclo-meta">${hora} — ${c.usuario || "—"}</div>
        <div class="ciclo-datos">${c.kg_ingreso} kg → ${c.bolsas} bolsas · ${c.cortes} cortes</div>
      </div>
      <div class="ciclo-estado ${ok ? "ok" : "err"}">${ok ? "✓ OK" : "✗ ERROR"}</div>
    `;
    list.appendChild(item);
  });
}

function resetDashStats() {
  ["dash-kg", "dash-merma-pct", "dash-cortes", "dash-errores"].forEach(id => {
    document.getElementById(id).textContent = "0";
  });
}

function volverDeDashboard() {
  if (state.cicloActual) goTo("resultado");
  else goTo("bodega");
}

/* ── TOAST ─────────────────────────────── */
let toastTimer = null;
function showToast(msg, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = "toast " + (type === "err" ? "err-toast" : type === "ok" ? "ok-toast" : "");
  toast.classList.add("show");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
    setTimeout(() => toast.classList.remove("hidden"), 300);
  }, 2500);
}

/* ── INIT ──────────────────────────────── */
window.addEventListener("DOMContentLoaded", () => {
  // Restaurar usuario guardado
  const saved = localStorage.getItem("usuario");
  if (saved) {
    document.getElementById("input-usuario").value = saved;
  }

  // Enter en login
  document.getElementById("input-usuario").addEventListener("keydown", e => {
    if (e.key === "Enter") login();
  });

  // Enter en bodega
  document.getElementById("input-kg-ingreso").addEventListener("keydown", e => {
    if (e.key === "Enter") iniciarProceso();
  });

  // Prevenir doble-tap zoom en botones
  document.querySelectorAll("button, .btn-primary").forEach(btn => {
    btn.addEventListener("touchend", e => e.preventDefault());
    btn.addEventListener("touchstart", e => { /* noop */ }, { passive: true });
  });

  console.log("✅ App iniciada");
});
