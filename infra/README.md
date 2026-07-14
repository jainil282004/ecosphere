# EcoSphere — Infrastructure & Containerization

## Step 3: Production multi-container Docker setup

### Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage Alpine API image — cached pnpm deps, non-root `ecosphere` user, `dumb-init` |
| `docker/Dockerfile.nginx` | Ingress gateway — embeds built SPA + `nginx.ecosphere.conf` |
| `docker-compose.yml` | Production stack: `ecosphere-db`, `ecosphere-api`, `ecosphere-nginx` |
| `docker-compose.infra.yml` | Dev-only Postgres + Redis (used by `pnpm up` / `pnpm infra:up`) |

### Production services

| Service | Image | Notes |
|---------|-------|-------|
| **ecosphere-db** | `postgres:16-alpine` | Health checks, persistent volume, credentials from `.env`, no public ports |
| **ecosphere-api** | Built from `Dockerfile` | Waits for DB health, runs Drizzle + TypeORM migrations on start, internal only |
| **ecosphere-nginx** | Built from `docker/Dockerfile.nginx` | Rate limiting, gzip, security headers, proxies `/api/v1` → API, serves SPA |
| *ecosphere-redis* | `redis:7-alpine` | Internal dependency for API job queue (not exposed) |

### Quick start (production stack)

```bash
cp .env.production.example .env
# Edit .env — set POSTGRES_PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

docker compose up -d --build
# App: http://localhost  (port 80 → nginx:8080)
```

### Enable HTTPS

1. Place `fullchain.pem` and `privkey.pem` in `infra/nginx/tls/`
2. Copy `infra/nginx/ssl.d/https.conf.example` → `infra/nginx/ssl.d/https.conf`
3. Restart: `docker compose up -d ecosphere-nginx`

### Development vs production

| Command | Stack |
|---------|-------|
| `pnpm up` | Infra containers + host-run API/Web (hot reload) |
| `pnpm up:full` | Dev infra + full container stack with separate web/nginx |
| `pnpm up:production` | Root `docker-compose.yml` (3-service production layout) |

### Security highlights

- API and Nginx run as non-root user `ecosphere` (UID 1001)
- `dumb-init` for proper signal handling in API container
- `security_opt: no-new-privileges:true` on all services
- DB/Redis not published to host in production compose
- Nginx: rate limiting on API/auth routes, CSP, X-Frame-Options, etc.

## Nginx reverse proxy (Step 2)

### Layout

```
infra/nginx/
  nginx.conf                 # Production — TLS termination, hardened headers, rate limits
  nginx.development.conf     # Local HTTP gateway (dev/staging full-stack)
  nginx.ecosphere.conf       # Production 3-service compose (embedded SPA)
  locations.conf             # API + upstream web proxy routes
  locations-spa.conf         # API + static SPA routes
  snippets/
    proxy-params.conf        # X-Real-IP, X-Forwarded-For, X-Forwarded-Proto, …
    security-headers.conf    # CSP, X-Frame-Options, CORP/COOP (production)
    security-headers-dev.conf
    gzip.conf                # Compression tuning
    rate-limits.conf         # api / auth / write / scrape / bot zones
  ssl.d/https.conf.example   # Optional HTTPS server block for ecosphere-nginx
```

### Proxy headers (`snippets/proxy-params.conf`)

Every proxied route sets:

| Header | Purpose |
|--------|---------|
| `X-Real-IP` | Original client IP |
| `X-Forwarded-For` | Proxy chain |
| `X-Forwarded-Proto` | Original scheme (`http` / `https`) |
| `X-Forwarded-Host` | Original host |
| `X-Forwarded-Port` | Ingress port |

### Security headers

Production responses include `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, and `Strict-Transport-Security` (TLS server).

### Rate limiting tiers

| Zone | Rate | Applied to |
|------|------|------------|
| `api_limit` | 30 req/s | `/api/v1/*` |
| `api_write_limit` | 10 req/s | POST/PUT/PATCH/DELETE only |
| `auth_limit` | 5 req/min | Login, register, password reset |
| `scrape_limit` | 15 req/s | Reports, exports, docs, SPA |
| `bot_limit` | 2 req/s | Empty or scripted User-Agents |
| `conn_limit` | 40 concurrent | Per-IP connection cap |

429 responses return standardized JSON with `Retry-After: 60`.

### Which config when

| Environment | Config file |
|-------------|-------------|
| Production (TLS) | `nginx.conf` + TLS certs in `tls/` |
| Dev / staging full-stack | `nginx.development.conf` |
| `docker compose` (3-service) | `nginx.ecosphere.conf` (baked into image) |

## Related configs

| Path | Purpose |
|------|---------|
| `infra/nginx/nginx.ecosphere.conf` | Production gateway (HTTP + optional TLS include) |
| `infra/nginx/ssl.d/https.conf.example` | TLS server block template |
| `scripts/docker-entrypoint-api.sh` | Wait-for-DB, migrate, seed, start API |
| `.github/workflows/ci.yml` | Builds `Dockerfile` + `docker/Dockerfile.nginx` in CI |
