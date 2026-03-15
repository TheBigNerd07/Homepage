# PiOne Command Center

PiOne Command Center is a self-hosted homelab homepage built for Raspberry Pi class hardware. Phase 3 turns the project into a lightweight personal homelab control center with multi-node awareness, safe command utilities, richer widgets, notes, dashboard personalization, stronger charts, and a more polished mobile experience without drifting into a heavy admin suite.

## Stack

- Frontend: React, TypeScript, Tailwind, Vite
- Backend: FastAPI, SQLAlchemy
- Database: SQLite
- Deployment: Docker Compose
- Target hardware: Raspberry Pi 4 / ARM64 Linux

## Phase 3 Highlights

- Multi-node support with node metadata, node health cards, node details, and service-to-node relationships
- Safe control center with whitelisted utilities, execution history, read-only logs, and confirmation gates for restart actions
- Persistent dashboard personalization: title, greeting, accent, background style, density, mobile mode, section visibility, widget layout, and favorite widgets
- Smarter daily briefing built from reminders, scripture progress, node/service health, and favorite widget summaries
- Expanded widget platform with a registry-driven layout model for future growth
- Lightweight charts for CPU, RAM, disk, service availability, and reading progress trends
- Built-in notes / scratchpad persisted in SQLite, including dashboard-pinned notes
- Keyboard-friendly command palette with `Cmd/Ctrl + K`

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
├── data
├── docker-compose.yml
└── README.md
```

## Core Concepts

### Multi-node model

Each node can store:

- `name`
- `hostname`
- `role`
- `description`
- optional `status_endpoint`
- optional `metrics_source`
- optional `tags`

The current installation automatically maintains a local primary node. Existing services are assigned to that node during migration unless you explicitly reassign them later.

### Widget layout model

Layout is persisted in SQLite through settings:

- dashboard sections can be enabled or hidden
- widgets can be enabled or disabled
- widgets can be moved up/down
- widgets can be reassigned to sections
- widgets can change size (`compact`, `half`, `wide`, `hero`)
- favorite widgets influence the daily briefing summaries

### Safe command model

The browser never gets unrestricted shell access by default.

Phase 3 exposes a fixed set of backend-controlled utilities:

- `docker ps`
- disk usage summary
- uptime summary
- hostname summary
- tail recent app logs
- restart configured dashboard containers

Important constraints:

- commands are explicitly whitelisted in backend code
- restart-style actions require confirmation in the UI
- command output is logged in recent action history
- logs are read-only
- `UNSAFE_TERMINAL_ENABLED` exists only as a documented off-by-default escape hatch for future experimentation; Phase 3 does not expose arbitrary browser shell execution

## Environment Variables

Copy the example file first:

```bash
cp .env.example .env
```

Important runtime variables:

- `PUBLIC_BASE_URL`: public HTTPS URL for reverse-proxy or tunnel deployments
- `TRUSTED_HOSTS`: comma-separated hostnames to trust in production
- `AUTH_ENABLED`: set to `true` to require login
- `AUTH_SECRET_KEY`: required when auth is enabled
- `AUTH_PASSWORD_HASH`: preferred password format
- `AUTH_PASSWORD`: raw password fallback for simple self-hosted setups
- `NAVIDROME_BASE_URL`, `NAVIDROME_USERNAME`, `NAVIDROME_PASSWORD`: enable Navidrome widgets
- `APP_LOG_PATH`: rotating backend log file used by the read-only logs viewer
- `APP_CONTAINER_NAME`: optional single container name for compatibility features
- `STACK_RESTART_CONTAINER_NAMES`: comma-separated container names the control center may restart
- `DOCKER_SOCKET_PATH`: Docker socket path if Docker-aware features are enabled
- `METRIC_SAMPLE_INTERVAL_SECONDS`: how often lightweight metric history is recorded
- `METRIC_SAMPLE_RETENTION_COUNT`: number of metric samples retained
- `CONTROL_RECENT_HISTORY_LIMIT`: number of recent command/action history entries returned to the UI
- `UNSAFE_TERMINAL_ENABLED`: documented advanced flag, kept `false` by default

Secrets stay in environment variables. Dashboard personalization, nodes, services, notes, reminders, and layout preferences stay in SQLite.

## Local Mac Development

### Docker hot reload

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
npm ci
npm run build
```

### Backend verification

Inside the backend container or a Python environment with dependencies installed:

```bash
python -m compileall backend/app
```

## Raspberry Pi Deployment On PiOne

Recommended target:

- Raspberry Pi 4
- ARM64 Linux
- Docker Engine with Compose plugin

Deployment workflow:

1. Copy the project to PiOne.
2. Create `.env` from `.env.example`.
3. Set `APP_TIMEZONE`, `LAB_HOSTNAME`, and optional public URL settings.
4. Decide whether to mount the Docker socket.

If you want:

- Docker-aware container summaries
- control-center restart actions
- Docker-backed log sources

then mount `/var/run/docker.sock` into the API container and set `STACK_RESTART_CONTAINER_NAMES`.

Start the stack:

```bash
docker compose up --build -d api web
```

Watch logs:

```bash
docker compose logs -f api web
```

Stop the stack:

```bash
docker compose down
```

## Multi-node Setup

Phase 3 no longer assumes a single host.

Suggested starting topology:

- `PiOne`: local primary node for dashboard, infrastructure, observability
- `MusicPi`: media node
- future NAS node
- future utility node

Recommended flow:

1. Open **Settings**.
2. Add nodes in the **Nodes** section.
3. Assign services to nodes in the **Services** section.
4. Optionally set a `status_endpoint` for remote nodes.
5. Use the **Nodes** page to inspect per-node health and service placement.

Current behavior:

- the local node can use real local metrics
- remote nodes can use metadata plus optional status endpoints
- future remote-agent style expansion is possible without changing the data model

## Dashboard Personalization

Personalization is stored per installation in SQLite.

You can configure:

- dashboard title
- display name / greeting
- accent color
- background style (`none`, `gradient`, `pattern`)
- density (`comfortable`, `compact`)
- mobile mode (`full`, `briefing`, `compact`)
- default service grouping
- today’s focus text
- widget favorites
- section visibility
- widget order, section placement, enable state, and size

The dashboard is rendered from the widget registry plus your saved layout settings, not from hardcoded page ordering.

## Control Center

The control center groups actions into categories such as:

- navigation
- maintenance
- diagnostics
- container actions

It also includes:

- whitelisted command utilities
- read-only logs
- recent action history
- command favorites

Restart-style actions are intentionally scoped to configured container names. They do not expose arbitrary shell access.

## Notes / Scratchpad

Phase 3 adds persistent plain-text notes:

- multiple notes supported
- each note has created and updated timestamps
- notes can be pinned in the notes list
- notes can be pinned to the dashboard

Suggested uses:

- homelab to-dos
- troubleshooting breadcrumbs
- future project ideas
- temporary maintenance notes

## Mobile / Tablet Behavior

Phase 3 improves the dashboard on smaller screens:

- responsive stacked cards
- larger touch targets
- sticky mobile navigation
- daily briefing remains prominent
- optional mobile modes:
  - `full`
  - `briefing`
  - `compact`

`briefing` and `compact` simplify the first mobile dashboard pass while still allowing the full dashboard to be expanded on demand.

## Command Palette

Keyboard shortcut:

- `Cmd + K` on macOS
- `Ctrl + K` elsewhere

The palette can search:

- pages
- services
- quick actions
- control-center commands
- node entries

## Navidrome Integration

Navidrome widgets remain optional.

Set:

```bash
NAVIDROME_BASE_URL=http://pione.local:4533
NAVIDROME_USERNAME=your-user
NAVIDROME_PASSWORD=your-password
```

When configured, the dashboard can show:

- library stats
- now playing data
- recently added albums

## Backups

Export bundles now include:

- SQLite snapshot
- settings JSON
- services JSON
- nodes JSON
- reminders JSON
- notes JSON
- scripture progress JSON
- quick action links JSON
- recent action history JSON
- metric samples JSON
- export metadata

If `BACKUP_DIR` is mounted, the ZIP is also stored there.

Restore guidance:

1. Stop the stack:

   ```bash
   docker compose down
   ```

2. Unzip the backup.
3. Replace `data/pione-homepage.db` with the saved database file for the fastest full restore.
4. Start the stack again:

   ```bash
   docker compose up -d api web
   ```

## Cloudflare Tunnel / Reverse Proxy

The app remains safe to place behind a reverse proxy or Cloudflare Tunnel if you configure:

- `PUBLIC_BASE_URL`
- `TRUSTED_HOSTS`
- `SESSION_COOKIE_SECURE=true` when using HTTPS

If auth is enabled, ensure `AUTH_SECRET_KEY` is strong and non-default.

## Troubleshooting

- Dashboard returns `401`
  - Check `AUTH_ENABLED`, `AUTH_SECRET_KEY`, and your password/hash settings.
- Login works locally but not through the tunnel
  - Set `PUBLIC_BASE_URL`, `TRUSTED_HOSTS`, and `SESSION_COOKIE_SECURE=true`.
- Remote node stays `unknown`
  - Confirm the node has a reachable `status_endpoint`, or accept metadata-only mode for that node.
- Service health stays `unknown`
  - Confirm the service has a reachable `health_check_url`.
- Control-center restart action is missing
  - Mount the Docker socket and set `STACK_RESTART_CONTAINER_NAMES`.
- Docker stats or `docker ps` are unavailable
  - The Docker socket is not mounted or permissions are missing.
- Log viewer is empty
  - Check `APP_LOG_PATH` and container write permissions for `/data/logs`.
- Navidrome widget is empty
  - Confirm all three Navidrome env vars are set and reachable from the API container.
- Mobile dashboard shows fewer widgets
  - Check the selected mobile mode in settings or use the “show full dashboard” toggle.

## API Overview

- `GET /api/health`
- `GET /api/auth/status`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/dashboard/summary`
- `GET /api/diagnostics/summary`
- `GET /api/settings`
- `PUT /api/settings`
- `GET|POST|PATCH|DELETE /api/services`
- `PUT /api/services/reorder`
- `GET|POST|PATCH|DELETE /api/nodes`
- `GET|POST|PATCH|DELETE /api/notes`
- `GET|POST|PATCH|DELETE /api/quick-actions`
- `PUT /api/quick-actions/reorder`
- `GET|POST|PATCH|DELETE /api/reminders`
- `POST /api/reminders/{id}/toggle`
- `GET /api/scripture/progress`
- `GET /api/scripture/history`
- `GET /api/scripture/chapters`
- `POST /api/scripture/complete`
- `GET /api/control-center/summary`
- `POST /api/control-center/actions/{action_key}`
- `POST /api/control-center/commands/{command_key}`
- `GET /api/control-center/logs`
- `POST /api/backups/export`
