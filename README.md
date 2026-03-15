# PiOne Command Center

PiOne Command Center is a self-hosted homelab homepage built for Raspberry Pi class hardware. Phase 2 extends the original dashboard into a lightweight operating console with optional auth, live host stats, stored service health checks, Navidrome activity, quick actions, backups, and Cloudflare Tunnel friendly deployment.

## Stack

- Frontend: React, TypeScript, Tailwind, Vite
- Backend: FastAPI, SQLAlchemy
- Database: SQLite
- Containers: Docker Compose with ARM-safe official images

## Phase 2 Features

- Optional session-based authentication for a single admin user
- Reverse proxy and Cloudflare Tunnel friendly deployment defaults
- Live system overview with CPU, memory, disk, uptime, load, temperature, network, and optional Docker counts
- Stored service health monitoring with configurable health URLs, intervals, response times, and recent check history
- Optional Navidrome widget powered by the Subsonic-compatible API
- Quick action control center with safe backend actions and configurable external links
- Timestamped backup/export bundles containing the SQLite snapshot plus JSON exports
- Expanded settings workspace for title, density, categories, reminder defaults, and health check defaults
- Diagnostics page with app health, database status, integrations, last backup, and recent service checks

## Project Structure

```text
.
├── backend
│   ├── app
│   │   ├── core
│   │   ├── db
│   │   ├── models
│   │   ├── routers
│   │   ├── schemas
│   │   └── services
│   └── Dockerfile
├── frontend
│   ├── src
│   ├── Dockerfile
│   └── nginx.conf
├── backups
├── data
├── .env.example
└── docker-compose.yml
```

## Environment Variables

Copy the example file first:

```bash
cp .env.example .env
```

Important runtime variables:

- `PUBLIC_BASE_URL`: public HTTPS URL for tunnel/reverse-proxy deployments
- `TRUSTED_HOSTS`: comma-separated hostnames to trust in production; use your tunnel hostname instead of `*`
- `AUTH_ENABLED`: set to `true` to require login
- `AUTH_SECRET_KEY`: required when auth is enabled
- `AUTH_PASSWORD_HASH`: preferred password format for auth
- `AUTH_PASSWORD`: raw password fallback for simple self-hosted setups
- `NAVIDROME_BASE_URL`, `NAVIDROME_USERNAME`, `NAVIDROME_PASSWORD`: enable Navidrome widgets
- `BACKUP_DIR`: mounted backup directory inside the API container
- `APP_CONTAINER_NAME`: required only if you want the restart-dashboard quick action
- `CLOUDFLARED_TUNNEL_TOKEN`: only needed when running `cloudflared` in Compose

Secrets should stay in environment variables. User-editable dashboard preferences stay in SQLite.

## Local Mac Development

### Docker hot-reload

```bash
docker compose --profile dev up --build api-dev frontend-dev
```

Open:

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Production-style local run

```bash
docker compose up --build api web
```

Open [http://localhost:3000](http://localhost:3000).

### Frontend-only verification

```bash
cd frontend
npm install
npm run build
```

## Raspberry Pi Deployment on PiOne

Recommended target:

- Raspberry Pi 4
- 64-bit Raspberry Pi OS or another ARM64 Linux
- Docker Engine with Compose plugin

Deployment workflow:

1. Copy the project to PiOne.
2. Create `.env` from `.env.example`.
3. Set `APP_TIMEZONE`, `LAB_HOSTNAME`, and `PUBLIC_BASE_URL` if the app will be exposed publicly.
4. Start the stack:

   ```bash
   docker compose up --build -d api web
   ```

5. Open the dashboard at `http://<pione-ip>:3000` or at your public tunnel URL.

Update workflow:

```bash
docker compose up --build -d api web
docker compose logs -f api web
```

Stop the stack:

```bash
docker compose down
```

## Cloudflare Tunnel

The app is safe to place behind a reverse proxy or Cloudflare Tunnel as long as you set the public URL and trusted hosts correctly.

### Option 1: Run `cloudflared` alongside the app

1. Create a tunnel in Cloudflare Zero Trust and obtain the tunnel token.
2. Set these variables in `.env`:

   ```bash
   PUBLIC_BASE_URL=https://dashboard.example.com
   TRUSTED_HOSTS=dashboard.example.com
   SESSION_COOKIE_SECURE=true
   CLOUDFLARED_TUNNEL_TOKEN=your-token
   ```

3. Point the tunnel hostname at the `web` service.
4. Start the tunnel profile:

   ```bash
   docker compose --profile tunnel up -d --build api web cloudflared
   ```

### Option 2: Run the tunnel externally on PiOne

If you run `cloudflared` directly on the Pi instead of in Compose, keep the application stack the same and only set:

```bash
PUBLIC_BASE_URL=https://dashboard.example.com
TRUSTED_HOSTS=dashboard.example.com
SESSION_COOKIE_SECURE=true
```

Then route the tunnel to the web container or host port:

- `http://127.0.0.1:3000`
- `http://<pione-ip>:3000`

### Tunnel security notes

- Enable authentication before exposing the dashboard publicly.
- Use a strong `AUTH_SECRET_KEY`.
- Restrict `TRUSTED_HOSTS` to the real hostname(s) you expect.
- Treat the Cloudflare tunnel token as a secret.
- Only mount the Docker socket if you explicitly want Docker-aware widgets or restart actions.

## Optional Authentication

Authentication is off by default. When disabled, the app behaves like the original Phase 1 dashboard.

To enable it:

```bash
AUTH_ENABLED=true
AUTH_ADMIN_USERNAME=admin
AUTH_SECRET_KEY=replace-with-a-long-random-secret
SESSION_COOKIE_SECURE=true
PUBLIC_BASE_URL=https://dashboard.example.com
TRUSTED_HOSTS=dashboard.example.com
```

Preferred password setup:

1. Generate a hash:

   ```bash
   docker compose run --rm api python -c "from app.core.auth import hash_password; print(hash_password('change-me'))"
   ```

2. Put the output in `AUTH_PASSWORD_HASH`.
3. Leave `AUTH_PASSWORD` empty.

Simpler fallback:

- Set `AUTH_PASSWORD=change-me`
- This is supported for self-hosted setups, but the hash form is better

When auth is enabled:

- The dashboard requires login before loading protected routes
- Backend dashboard/config/data routes return `401` without a valid session
- Logout is available in the app shell

## Service Health Monitoring

Each service can optionally define:

- `health_check_url`
- `health_check_interval_seconds`
- `health_check_timeout_seconds`

If no health URL is set, the service keeps its manual status.

If a health URL is set:

- Background checks run on a lightweight loop
- Last checked time, response time, and status reason are stored
- Recent check history is shown in diagnostics

Recommended defaults live in Settings and are persisted in SQLite.

## Navidrome Integration

Navidrome widgets stay disabled until all three values are configured:

```bash
NAVIDROME_BASE_URL=http://pione.local:4533
NAVIDROME_USERNAME=your-user
NAVIDROME_PASSWORD=your-password
```

The dashboard will then show:

- Recently added albums
- Now playing sessions
- Basic library counts when available

If Navidrome is unavailable, the widget degrades gracefully instead of breaking the page.

## Quick Actions / Control Center

Built-in safe actions:

- Refresh service checks
- Export backup bundle
- Open diagnostics
- Open settings

Optional backend action:

- Restart dashboard container

To enable the restart action:

1. Mount `/var/run/docker.sock` into the API container.
2. Set `APP_CONTAINER_NAME` to the container you want restarted.

Configurable external action links are managed in Settings and are intended for safe navigation targets like Portainer or Grafana.

## Backups and Restore Guidance

Exports are triggered from the dashboard quick actions area.

Each export bundle contains:

- SQLite database snapshot
- Settings JSON
- Services JSON
- Reminders JSON
- Scripture tracker JSON
- Quick action links JSON
- Export metadata

If `BACKUP_DIR` is mounted, the archive is also stored there with a timestamped filename.

Restore guidance:

1. Stop the stack:

   ```bash
   docker compose down
   ```

2. Unzip the backup.
3. Replace `data/pione-homepage.db` with the saved database file for the simplest full restore.
4. Start the stack again:

   ```bash
   docker compose up -d api web
   ```

JSON exports are included for selective recovery or inspection, but the SQLite snapshot is the fastest full restore path.

## Persistent Data

Persistent directories:

- `./data` for SQLite
- `./backups` for exported backup archives

The backend uses SQLite WAL mode and creates a safe snapshot during export instead of copying the live DB file blindly.

## Diagnostics Page

The diagnostics view shows:

- App version and environment
- Backend and database status
- Last export time and backup path
- Recent service health check results
- Integration availability summary

Sensitive secrets are not exposed in the UI.

## Troubleshooting

- Dashboard returns `401`
  - Check `AUTH_ENABLED`, `AUTH_SECRET_KEY`, and your password/hash settings.
- Login works locally but not through the tunnel
  - Set `PUBLIC_BASE_URL`, `TRUSTED_HOSTS`, and `SESSION_COOKIE_SECURE=true`.
- Service checks stay `unknown`
  - Confirm the service has a reachable `health_check_url`.
- Docker stats are unavailable
  - The Docker socket is not mounted or the API container lacks permission.
- Navidrome widget is empty
  - Confirm all three Navidrome env vars are set and the API is reachable from the container.
- Backup export downloads but is not stored
  - Set `BACKUP_DIR` and keep `./backups:/backups` mounted.

## API Overview

- `GET /api/health`
- `GET /api/auth/status`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/dashboard/summary`
- `GET /api/diagnostics/summary`
- `POST /api/backups/export`
- `POST /api/actions/{action_key}`
- `GET|POST|PATCH|DELETE /api/services`
- `PUT /api/services/reorder`
- `GET|POST|PATCH|DELETE /api/quick-actions`
- `PUT /api/quick-actions/reorder`
- `GET|POST|PATCH|DELETE /api/reminders`
- `POST /api/reminders/{id}/toggle`
- `GET /api/scripture/progress`
- `GET /api/scripture/history`
- `GET /api/scripture/chapters`
- `POST /api/scripture/complete`
- `GET /api/settings`
- `PUT /api/settings`
