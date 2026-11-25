# Chitagá Tech

Sitio web y backend de **Chitagá Tech**, una comunidad de jóvenes y profesionales locales que creen que desde Chitagá también se puede hacer tecnología. Aprendemos juntos, construimos proyectos reales y trabajamos para que el municipio tenga su primer ecosistema de innovación.

> **"Que irse sea opción, no obligación"**

El repositorio contiene dos piezas que se despliegan por separado:

| Pieza | Carpeta | Qué hace |
|-------|---------|----------|
| **Frontend** | `src/` | Sitio estático en Astro (landing, reglas, página de evento, panel privado de inscripciones). |
| **Backend** | `server/` | API Express + SQLite para contacto, inscripciones a eventos, sugerencias y envío de correos. |

Ambas comparten la configuración de `src/data/` (eventos, sugerencias, navegación), que el backend importa en tiempo de ejecución para validar peticiones.

---

## Novedades recientes

- Panel privado de inscripciones (`/admin/inscripciones`): consulta registros por evento con autenticación por `ADM_KEY`.
- Flujo de comunicaciones del evento consolidado: invitación de calendario por grupo al inscribirse y recordatorio automático el día del evento.

---

## Tech Stack

**Frontend**

- [Astro](https://astro.build) 5 — Framework web, salida estática
- [React](https://react.dev) 19 + [Framer Motion](https://www.framer.com/motion/) — Componentes interactivos (toggle de tema, animaciones al hacer scroll)
- [Tailwind CSS v4](https://tailwindcss.com) (vía `@tailwindcss/vite`) — Estilos
- [shadcn/ui](https://ui.shadcn.com) (estilo `radix-vega`) + [Radix UI](https://www.radix-ui.com) — Componentes UI
- [Hugeicons](https://hugeicons.com) / [react-icons](https://react-icons.github.io/react-icons/) — Iconos
- [TypeScript](https://www.typescriptlang.org) (`astro/tsconfigs/strict`) — Tipado
- [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) — `sitemap-index.xml` automático

**Backend**

- [Express](https://expressjs.com) 5 — API HTTP
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — Base de datos embebida (SQLite, modo WAL)
- [Nodemailer](https://nodemailer.com) — Envío de correos vía Gmail
- Sin ORM ni framework de migraciones: consultas preparadas y migraciones inline en `server/db/init.js`.

---

## Requisitos

- Node.js **>= 20** (better-sqlite3 requiere toolchain de compilación nativa; en la mayoría de sistemas se resuelve solo al instalar)
- Una cuenta de Gmail con **contraseña de aplicación** para el envío de correos

---

## Instalación

```bash
git clone https://github.com/yamiddevofic/chitaga-tech.git
cd chitaga-tech
npm install
```

### Variables de entorno

El backend lee un archivo **`server/.env`** mediante un parser mínimo propio (`server/config/env.js`); no se usa `dotenv` y las variables ya presentes en el entorno tienen prioridad.

```env
# --- Envío de correos (obligatorio para contacto / inscripciones / sugerencias) ---
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   # contraseña de aplicación de Google, NO la del correo
NOTIFY_EMAIL=email-admin@example.com     # destino de todas las notificaciones internas

# --- Rutas privadas ---
ADM_KEY=clave-secreta-admin              # protege el panel y los envíos masivos

# --- Opcionales ---
PORT=4324                                # puerto del API (default 4324)
TIME_ZONE=America/Bogota                 # zona horaria para calcular "hoy" en recordatorios (default America/Bogota)
```

| Variable | Obligatoria | Usada por | Descripción |
|----------|:-----------:|-----------|-------------|
| `GMAIL_USER` | sí | `server/`, script | Cuenta Gmail que envía los correos |
| `GMAIL_APP_PASSWORD` | sí | `server/` | Contraseña de aplicación de Google |
| `NOTIFY_EMAIL` | sí | `server/` | Dirección que recibe avisos de contacto, inscripción y sugerencias |
| `ADM_KEY` | sí | `server/`, script | Clave que exige la cabecera `x-admin-key` en rutas privadas |
| `PORT` | no | `server/` | Puerto del API (default `4324`) |
| `TIME_ZONE` | no | `server/` | Zona horaria para la validación de fecha de los recordatorios (default `America/Bogota`) |
| `EVENT_SLUG` | no | script `reminders` | Slug del evento; alternativa a pasarlo como argumento |
| `REMINDER_API_URL` | no | script `reminders` | URL base del API (default `http://localhost:4324`) |

---

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo Astro en el puerto **4323**. Proxifica `/api` → `http://localhost:4324`, así que para probar formularios hay que tener el API corriendo en paralelo (`npm run server`). |
| `npm run dev:host` | Igual que `dev` pero accesible desde la red local (`--host`). |
| `npm run build` | Genera el sitio estático en `dist/`. |
| `npm run preview` | Sirve el build de `dist/` (Astro preview, puerto `4321` por defecto). |
| `npm run preview:host` | Preview accesible desde la red local. |
| `npm run server` | Inicia el API Express (puerto `4324` o `PORT`). Crea `server/chitaga.db` si no existe. |
| `npm run reminders` | Dispara el recordatorio del día del evento. Necesita `ADM_KEY` en el entorno y el slug (argumento o `EVENT_SLUG`); ver [Comunicaciones por correo](#comunicaciones-por-correo). |
| `npm run deploy` | `build` + `preview`. |

---

## Estructura

```
chitaga-tech/
├── astro.config.mjs         # Config Astro: site, puerto 4323, proxy /api, integraciones
├── components.json          # Config shadcn/ui (estilo radix-vega, iconos hugeicons)
├── run-server.sh            # Wrapper de auto-restart del API para producción
├── src/
│   ├── pages/               # Rutas Astro
│   │   ├── index.astro      #   Landing
│   │   ├── reglas.astro     #   Reglas de la comunidad + formulario de sugerencias
│   │   ├── evento/[slug].astro   # Página de evento + formulario de inscripción
│   │   └── admin/inscripciones.astro  # Panel privado (auth por ADM_KEY en el cliente)
│   ├── components/          # Componentes Astro + React + shadcn/ui (ui/)
│   ├── layouts/Layout.astro # Layout con header, footer, SEO y JSON-LD de Organization
│   ├── data/                # Configuración compartida frontend + backend
│   │   ├── events.js        #   Eventos y campos de formulario (getEventBySlug, getOpenEvents)
│   │   ├── suggestions.js   #   Buzones de sugerencias (suggestionTopics, isValidTopic)
│   │   ├── rules.js         #   Reglas de la comunidad
│   │   ├── navigation.js    #   Enlaces del menú
│   │   └── site.js          #   Metadatos del sitio y redes sociales
│   ├── styles/              # CSS global y por página
│   ├── scripts/header.js    # JS del header (renderizado en el Layout)
│   └── lib/utils.ts         # Helper cn() para clases
├── public/
│   └── scripts/             # JS del lado del cliente, servido sin bundling
│       ├── contact-form.js
│       ├── evento-form.js
│       ├── suggestion-form.js
│       └── admin-inscripciones.js
├── server/
│   ├── index.js             # API Express: rutas, rate limiting, envío de correos
│   ├── config/
│   │   ├── env.js           #   Parser de server/.env
│   │   ├── cors.js          #   Orígenes permitidos
│   │   └── email.js         #   Transporter de Nodemailer (service: gmail)
│   ├── db/init.js           # Apertura de SQLite, DDL, migraciones y consultas preparadas
│   ├── templates/           # Plantillas HTML de correo
│   │   ├── contact-email.js
│   │   ├── registration-email.js
│   │   ├── suggestion-email.js
│   │   ├── invitation-email.js
│   │   └── reminder-email.js
│   └── chitaga.db           # SQLite (gitignored, se crea al arrancar)
├── scripts/
│   └── send-reminders.js    # CLI que llama a POST /api/events/:slug/send-reminders
└── dist/                    # Build de producción (gitignored)
```

Alias de import: `@/*` → `src/*` (definido en `tsconfig.json`).

---

## Configuración dirigida por datos

`src/data/events.js` y `src/data/suggestions.js` son la única fuente de verdad tanto para el frontend como para el backend (el servidor los importa dinámicamente al arrancar).

**Agregar un evento** — añade un objeto al array `events`:

```js
{
  slug: "mi-evento",                 // usado en la URL /evento/mi-evento y como event_slug en la BD
  title: "...",
  description: "...",
  date: "2026-03-20",                // YYYY-MM-DD; los recordatorios solo se envían si coincide con hoy
  time: "...",
  location: "...",
  capacity: 30,                      // el backend rechaza inscripciones al llegar al tope
  status: "open",                    // solo "open" acepta inscripciones
  badge: "...",
  image: "/mi-evento.jpg",
  fields: [                          // cada campo genera un input y se valida en cliente y servidor
    { name: "name",  label: "Nombre completo", type: "text",  required: true, min: 3 },
    { name: "email", label: "Correo",          type: "email", required: true },
    { name: "group", label: "Horario", type: "select", required: true, options: [
      { value: "", label: "Escoge tu horario" },
      { value: "grupo-1", label: "Grupo 1 — ..." },
      { value: "grupo-2", label: "Grupo 2 — ..." },
    ]},
    // ...
  ],
}
```

Tipos de campo soportados: `text`, `email`, `tel`, `number`, `select`, `textarea`. El servidor valida `required`, `min`/`max` (longitud o rango numérico), formato de email y que los `select` obligatorios estén dentro de sus `options`. Solo se guardan los campos declarados en `fields`.

> ⚠️ Si el formulario usa un campo `group` para agendar por grupos, los mapas `calendarLinks` y `groupLabels` están **hardcodeados en `server/index.js`** y hay que actualizarlos por evento.

**Agregar un buzón de sugerencias** — añade `{ topic, label }` a `suggestionTopics` en `src/data/suggestions.js`. `isValidTopic()` se usa en el backend para rechazar temas desconocidos.

---

## API

Base URL en desarrollo: `http://localhost:4324` (o vía el proxy `/api` de Astro en `http://localhost:4323`).

### Rutas públicas

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/health` | GET | Health check (`{ status, timestamp }`). |
| `/api/contact` | POST | Envía el formulario de contacto. Body: `{ name, email, message }`. |
| `/api/check-email` | GET | `?email=` → `{ exists }`. Comprueba si un correo ya envió contacto. Máx. 30 peticiones/min por IP. |
| `/api/check-name` | GET | `?name=` → `{ exists }`. Comprueba si un nombre ya envió contacto. Máx. 30 peticiones/min por IP. |
| `/api/events/:slug/spots` | GET | `{ count, capacity }` de inscripciones del evento. |
| `/api/events/:slug/register` | POST | Inscribe a un evento. Body: los `name` de los `fields` del evento. |
| `/api/suggestions` | POST | Envía una sugerencia. Body: `{ topic, name?, message }` (mensaje 20–2000 caracteres). |

### Rutas privadas (cabecera `x-admin-key: <ADM_KEY>`)

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/contacts` | GET | Lista todos los contactos (sin IP). |
| `/api/suggestions` | GET | Lista sugerencias (sin IP); `?topic=` filtra por buzón. |
| `/api/events/:slug/registrations` | GET | Lista los registros del evento con `data` ya parseado. |
| `/api/events/:slug/send-invitations` | POST | Reenvía la invitación de calendario a todos los inscritos, por grupo. Devuelve `{ sent, failed, errors }`. |
| `/api/events/:slug/send-reminders` | POST | Envía el recordatorio del día. **Solo funciona si `event.date` coincide con la fecha actual** (según `TIME_ZONE`). Devuelve `{ sent, failed, skipped, errors }`. |

### Endurecimiento y límites

- **Rate limiting** en las rutas POST: 10 peticiones por 60 s por IP; en `check-email` / `check-name`: 30 por 60 s, con contador aparte para que la validación en vivo no bloquee el envío (en memoria; se reinicia al reiniciar el proceso).
- Las respuestas de listados (`/api/contacts`, `/api/suggestions`) nunca incluyen la IP.
- **Antiduplicados por IP**: un contacto por IP (global), una inscripción por IP por evento, una sugerencia por IP por `topic`.
- `express.json` limitado a **16 kb**; cabecera `X-Content-Type-Options: nosniff`; `trust proxy` = 1 (respeta `X-Forwarded-For` de un proxy).
- CORS restringido a `https://chitaga.tech`, `https://www.chitaga.tech` y `http://localhost:4323`, métodos `GET` y `POST` (`server/config/cors.js`).

---

## Panel privado de inscripciones

- URL: `/admin/inscripciones`
- Se pide la clave de administrador (`ADM_KEY`) en el cliente; se envía como `x-admin-key` a `/api/events/:slug/registrations` y se guarda en `sessionStorage` para no re-teclearla durante la sesión.
- Muestra, por evento: resumen de cupos, fecha y horario; y cada registro con todos los campos del formulario, fecha de registro e IP.

---

## Comunicaciones por correo

Plantillas en `server/templates/`. El transporter usa `service: 'gmail'` con `GMAIL_USER` / `GMAIL_APP_PASSWORD`.

| Momento | Correo | Disparador |
|---------|--------|-----------|
| Nuevo contacto | Aviso a `NOTIFY_EMAIL` | `POST /api/contact` |
| Nueva sugerencia | Aviso a `NOTIFY_EMAIL` | `POST /api/suggestions` |
| Nueva inscripción | Aviso a `NOTIFY_EMAIL` + confirmación con invitación de calendario al participante (según su `group`) | `POST /api/events/:slug/register` |
| Antes del evento (manual) | Reenvío de invitación de calendario a todos, por grupo | `POST /api/events/:slug/send-invitations` |
| Día del evento | Recordatorio personalizado: horario/grupo, link de calendario y aviso si aún falta la foto (`has_photo`) | `POST /api/events/:slug/send-reminders` |

### Ejecutar el recordatorio el día del evento

1. Asegúrate de que el evento tiene `date` con la fecha de hoy (p. ej. `date: "2026-03-20"`) y que el API está corriendo (`npm run server`).
2. Con los mismos secretos (`ADM_KEY`, `GMAIL_*`) en el entorno, ejecuta:

```bash
EVENT_SLUG=crea-tu-primera-web \
REMINDER_API_URL=http://localhost:4324 \
ADM_KEY=clave-secreta-admin \
npm run reminders
```

   (también puedes pasar el slug como argumento: `npm run reminders -- crea-tu-primera-web`).
3. Prográmalo en tu scheduler (cron, etc.) a la hora de arranque deseada. La llamada **falla si `event.date` no es hoy**, lo que garantiza que solo se dispare el día correcto.

---

## Base de datos

SQLite (`server/chitaga.db`, modo WAL) creado automáticamente al arrancar el API. Sin herramienta de migraciones: `server/db/init.js` ejecuta `CREATE TABLE IF NOT EXISTS` y `ALTER TABLE ... ADD COLUMN ip` defensivos.

| Tabla | Contenido | Notas |
|-------|-----------|-------|
| `contacts` | Formulario de contacto | `name`, `email`, `message`, `ip`, `created_at` |
| `event_registrations` | Inscripciones a eventos | `event_slug`, `email`, `data` (JSON con los campos del formulario), `ip`; `UNIQUE(event_slug, email)` |
| `suggestions` | Sugerencias de la comunidad | `topic`, `name` (opcional), `message`, `ip`, `created_at` |

Backup = copiar el archivo `server/chitaga.db` (más `-wal` / `-shm` si existen).

---

## Despliegue

- **Frontend:** `npm run build` y servir `dist/` como archivos estáticos (Nginx).
- **Backend:** Node.js/Express con auto-restart mediante `run-server.sh` (bucle `while` que reinicia el proceso si cae). Ajusta la ruta `cd` del script a la ubicación real del repo en el servidor.
- **Túnel:** Cloudflare Tunnel
  - `chitaga.tech` / `www.chitaga.tech` → frontend
  - `server.chitaga.tech` → puerto `4324` (API)
- Recuerda crear `server/.env` en el servidor y programar el recordatorio en cron si el evento lo requiere.

---

## Licencia

MIT
