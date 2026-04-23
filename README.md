# 🥩 Control de Carne — PWA Buffet

Sistema de control de ciclos de producción de carne para buffet.
Diseñado para operar **offline** en iPhone (Safari) como app instalada.

---

## 🚀 Setup rápido

### 1. Crear proyecto en Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. Crear proyecto → **Agregar aplicación web**
3. Copia el objeto `firebaseConfig`
4. Ábrelo en `js/firebase.js` y reemplaza los valores del objeto `firebaseConfig`

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "tu-proyecto.firebaseapp.com",
  projectId:         "tu-proyecto",
  storageBucket:     "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc..."
};
```

### 2. Configurar Firestore

En Firebase Console:
- **Firestore Database** → Crear base de datos → Modo producción
- Agrega estas reglas en la pestaña "Reglas":

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ciclos/{cicloId} {
      allow read, write: if true; // Ajusta según autenticación
    }
  }
}
```

### 3. Subir a GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USER/TU_REPO.git
git push -u origin main
```

Luego en GitHub: **Settings → Pages → Deploy from branch → main**

Tu app estará en: `https://TU_USER.github.io/TU_REPO/`

### 4. Instalar en iPhone

1. Abre la URL en Safari
2. Toca el botón **Compartir** (cuadrado con flecha ↑)
3. Selecciona **"Agregar a pantalla de inicio"**
4. Confirma → ¡Listo!

---

## 📱 Flujo de uso

```
LOGIN → BODEGA (kg ingresados) → COCINA (kg útil + merma + bolsas) → RESULTADO
```

| Pantalla | Datos |
|----------|-------|
| Bodega   | KG ingresados al proceso |
| Cocina   | KG útiles + KG merma + N° bolsas |
| Resultado | Cortes, peso/bolsa, estado OK/ERROR |
| Dashboard | Resumen del día, ciclos con error |

---

## ⚙️ Configuración

| Parámetro | Dónde | Descripción |
|-----------|-------|-------------|
| `tolerancia` | Dashboard → abajo | Diferencia máxima permitida entre ingreso y (útil+merma). Default: **0.5 kg** |
| `kg por corte` | `app.js` línea `bolsas * 20` | Cortes por bolsa. Default: **20** |

---

## 🗂️ Estructura del proyecto

```
buffet-pwa/
├── index.html          # App completa (4 pantallas)
├── manifest.json       # Configuración PWA
├── sw.js               # Service Worker (offline)
├── css/
│   └── style.css       # Diseño industrial
├── js/
│   ├── app.js          # Lógica principal
│   └── firebase.js     # Firebase + fallback local
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## 🗃️ Estructura Firestore

Colección: **`ciclos`**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `fecha` | Timestamp | Fecha y hora del ciclo |
| `usuario` | string | Nombre del operador |
| `kg_ingreso` | number | KG ingresados en bodega |
| `kg_util` | number | KG útiles tras proceso |
| `merma` | number | KG de merma |
| `bolsas` | number | N° de bolsas |
| `cortes` | number | Bolsas × 20 |
| `diferencia` | number | (util+merma) − ingreso |
| `estado` | string | `"OK"` o `"ERROR"` |
| `merma_pct` | number | % de merma sobre ingreso |

---

## 📴 Modo offline

- Los ciclos se guardan en `localStorage` si no hay internet
- Firebase SDK sincroniza automáticamente al reconectarse
- El Service Worker cachea la app para uso sin conexión

---

## 🔒 Notas de seguridad

Para producción, agrega autenticación Firebase (Firebase Auth con email/contraseña simple) y ajusta las reglas de Firestore según tus necesidades.

---

Desarrollado para entornos de baja capacitación técnica. Diseño industrial minimalista optimizado para iPhone en Safari.
