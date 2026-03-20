# Chitaga Tech

Nos fuimos para aprender, volvemos para construir. Comunidad tech en Chitaga, Norte de Santander, Colombia.

> **"Que irse sea opcion, no obligacion"**

## Novedades recientes

- Se integró el panel privado de inscripciones (`/admin/inscripciones`) para consultar registros por evento con autenticación por `ADM_KEY`.
- Se consolidó el flujo de comunicaciones del evento: invitaciones de calendario por grupo y recordatorios del día del evento.

## Tech Stack

- [Astro](https://astro.build) — Framework web
- [React](https://react.dev) + [Framer Motion](https://www.framer.com/motion/) — Componentes interactivos
- [Tailwind CSS v4](https://tailwindcss.com) — Estilos
- [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com) — Componentes UI
- [TypeScript](https://www.typescriptlang.org) — Tipado
- [Express](https://expressjs.com) + [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — API backend
- [Nodemailer](https://nodemailer.com) — Envio de correos

## Requisitos

- Node.js >= 20

## Instalacion

```bash
git clone https://github.com/yamiddevofic/chitaga-tech.git
cd chitaga-tech
npm install
```

### Variables de entorno

Crear un archivo `server/.env`:

```env
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=tu-app-password
NOTIFY_EMAIL=email-admin@example.com
ADM_KEY=clave-secreta-admin
PORT=4324
TIME_ZONE=America/Bogota # opcional, zona horaria usada para calcular "hoy" en recordatorios
```

`ADM_KEY` protege las rutas privadas del panel de inscripciones y los envios masivos de correos.

## Scripts

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo Astro (puerto 4323) |
| `npm run dev:host` | Dev accesible desde la red local |
| `npm run build` | Genera el sitio estatico en `dist/` |
| `npm run preview` | Preview del build |
| `npm run preview:host` | Preview accesible desde la red local |
| `npm run server` | Inicia el API server Express (puerto 4324) |
| `npm run reminders` | Dispara recordatorios (requiere `EVENT_SLUG` y `ADM_KEY`) |
| `npm run deploy` | Build + preview |

## Estructura

```
chitaga-tech/
├── src/
│   ├── pages/              # Paginas Astro (index, reglas, evento/[slug])
│   │   └── admin/           # Panel privado de inscripciones por evento
│   ├── components/         # Componentes Astro + React + shadcn/ui
│   ├── layouts/            # Layout principal con header, footer y SEO
│   ├── data/               # Configuracion del sitio, eventos, navegacion
│   ├── styles/             # CSS global y por componente
│   └── lib/                # Utilidades TypeScript
├── server/
│   ├── index.js            # API Express
│   ├── config/             # Env, CORS, email
│   ├── db/                 # SQLite schema e inicializacion
│   └── templates/          # Plantillas HTML de emails
├── public/
│   └── scripts/            # JS del lado del cliente (formularios)
├── scripts/
│   └── send-reminders.js   # Script CLI para recordatorios
└── dist/                   # Build de produccion
```

## API Endpoints

| Ruta | Metodo | Descripcion |
|------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/contact` | POST | Enviar formulario de contacto |
| `/api/contacts` | GET | Listar contactos |
| `/api/events/:slug/spots` | GET | Cupos disponibles de un evento |
| `/api/events/:slug/check-email` | GET | Verificar si un email ya esta registrado |
| `/api/events/:slug/register` | POST | Registrarse a un evento |
| `/api/events/:slug/registrations` | GET | Listar registros (admin) |
| `/api/events/:slug/send-invitations` | POST | Reenviar invitaciones de calendario por grupo (admin) |
| `/api/events/:slug/send-reminders` | POST | Enviar recordatorio del dia del evento (admin) |
| `/api/suggestions` | GET/POST | Sugerencias de la comunidad |

Todas las rutas POST tienen rate limiting (10 req/60s por IP).

Las rutas privadas `/api/events/:slug/registrations`, `/api/events/:slug/send-invitations` y `/api/events/:slug/send-reminders` solicitan la cabecera `x-admin-key`.

`/api/events/:slug/send-reminders` solo dispara correos cuando `date` coincide con la fecha actual (segun `TIME_ZONE`).

## Panel privado de inscripciones

- URL: `/admin/inscripciones`
- Permite consultar inscritos por evento con resumen de cupos, fecha y horario.
- Muestra cada registro con todos los campos del formulario, fecha de registro e IP.
- La clave de administrador se guarda en `sessionStorage` para agilizar consultas dentro de la misma sesion.

## Comunicaciones por correo

- Al registrarse, cada participante recibe confirmacion e invitacion de calendario segun su grupo.
- `POST /api/events/:slug/send-reminders` envia recordatorios personalizados el mismo dia del evento e incluye de nuevo el link de calendario (por si aun no lo agregaron), junto con horario/grupo y estado de foto.
- `POST /api/events/:slug/send-invitations` queda como opcion manual para reenviar invitaciones de calendario a todos los inscritos antes del dia del evento.

### Ejecutar recordatorio a las 7 a.m.

- Asegúrate de que el evento que quieres recordar tenga `date: "2026-03-20"` y el backend esté corriendo (`npm run server`).
- Usa los mismos secretos (`ADM_KEY`, `GMAIL_*`) y ejecuta el script:

```bash
EVENT_SLUG=crea-tu-primera-web \
REMINDER_API_URL=http://localhost:4324 \
npm run reminders
```

- Programa ese comando en tu scheduler (cron, Cloudflare Tunnel cron, etc.) para que corra hoy viernes 20 de marzo a las 7:00 a.m.; la llamada fallará si el evento no tiene la fecha de hoy, garantizando que solo se dispare a primera hora.

## Base de datos

SQLite con WAL mode y 3 tablas:

- **contacts** — Formulario de contacto (nombre, email, mensaje)
- **event_registrations** — Inscripciones a eventos (unico por email + evento, datos en JSON)
- **suggestions** — Sugerencias de la comunidad (tema, nombre, mensaje)

## Despliegue

- **Frontend:** Archivos estaticos servidos por Nginx
- **Backend:** Node.js/Express con auto-restart (`run-server.sh`)
- **Tunel:** Cloudflare Tunnel
  - `chitaga.tech` / `www.chitaga.tech` → puerto 4322
  - `server.chitaga.tech` → puerto 4324

## Licencia

MIT
