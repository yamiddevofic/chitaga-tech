---
name: dev-vs-prod-config
description: Astro dev uses port 4322 (no tunnel), production uses port 4323 with Cloudflare tunnel (allowedHosts, WSS HMR)
type: project
---

Dev mode: port 4322, no Cloudflare tunnel config in vite.server.
Production mode: port 4323, with Cloudflare tunnel config (allowedHosts for chitaga.tech, WSS HMR on clientPort 443).

**Why:** The site is served through a Cloudflare tunnel in production, which requires specific vite server settings.
**How to apply:** When user says "modo dev" → port 4322, remove tunnel config. When user says "modo producción" → port 4323, add allowedHosts and WSS HMR config.
