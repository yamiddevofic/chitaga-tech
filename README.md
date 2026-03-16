# Chitaga Tech

Nos fuimos para aprender, volvemos para construir. Comunidad tech en Chitaga, Norte de Santander, Colombia.

## Tech Stack

- [Astro](https://astro.build) — Framework web
- [React](https://react.dev) + [Framer Motion](https://www.framer.com/motion/) — Componentes interactivos
- [Tailwind CSS v4](https://tailwindcss.com) — Estilos
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

## Desarrollo

```bash
# Frontend (puerto 4323)
npm run dev

# Backend API (puerto 4324)
npm run server
```

## Produccion

```bash
npm run build
```

El build genera archivos estaticos en `dist/`, servidos con Nginx y expuestos via Cloudflare Tunnel.

## Estructura

```
src/
├── components/    # Componentes Astro y React
├── layouts/       # Layout principal con SEO
├── pages/         # Paginas (index, reglas)
server/
├── index.js       # API Express + SQLite
public/            # Assets estaticos, OG images
```

## Licencia

MIT
