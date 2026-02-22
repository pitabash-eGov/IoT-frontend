# IoT Frontend

React web application for managing IoT devices, viewing real-time status/telemetry, and weather data.

**Tech Stack:** Vite + React 19 + Tailwind CSS 4 + Axios + STOMP/SockJS + lucide-react

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Browser (React SPA)                             │
│                                                                         │
│   LoginPage ─── RegisterPage ─── DashboardPage ─── DeviceDetailPage    │
│       │               │               │                   │             │
│       └───── AuthContext (JWT) ───────┘                   │             │
│                       │                                    │             │
│               Axios Interceptors              STOMP/SockJS Client       │
│          (snake_case ↔ camelCase)            (real-time updates)        │
│                       │                           │                     │
└───────────────────────┼───────────────────────────┼─────────────────────┘
                        │ HTTP :3000/api/*           │ WS :3000/api/ws
                        │ (Vite proxy / nginx)       │ (Vite proxy / nginx)
                        ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     API Gateway (:8080)                                  │
│                                                                         │
│   /api/auth/login, /api/auth/register ──────────► No JWT filter         │
│   /api/auth/** ─────────────────────────────────► JWT filter            │
│   /api/devices/** ──────────────────────────────► JWT filter            │
│   /api/weather/** ──────────────────────────────► JWT filter            │
│   /api/ws/** ───────────────────────────────────► No JWT filter         │
│                                                                         │
│   JWT Filter: validates token → adds X-User-Id header → StripPrefix=1  │
└──────┬──────────────┬──────────────┬───────────────┬────────────────────┘
       │              │              │               │
       ▼              ▼              ▼               ▼
┌───────────┐  ┌────────────┐  ┌───────────┐  ┌───────────────┐
│ Auth Svc  │  │ Device Svc │  │Weather Svc│  │ Discovery Svc │
│  :8081    │  │  :8082     │  │  :8084    │  │    :8761      │
│           │  │            │  │           │  │   (Eureka)    │
│ auth_db   │  │ device_db  │  │  (no DB)  │  │               │
│ (Postgres)│  │ (Postgres) │  │           │  │               │
│           │  │  + MQTT    │  │OpenWeather│  │               │
│           │  │  + WSocket │  │  API proxy│  │               │
└───────────┘  └────────────┘  └───────────┘  └───────────────┘
```

---

## Project Structure

```
src/
├── main.jsx                          # Entry point
├── App.jsx                           # Router + AuthProvider + Routes
├── api/
│   ├── axios.js                      # Axios instance, JWT interceptor, snake↔camel
│   ├── auth.js                       # login, register, refresh, getMe
│   ├── devices.js                    # CRUD: list, get, create, update, delete
│   └── weather.js                    # getWeather(lat, lon, units)
├── context/
│   └── AuthContext.jsx               # AuthProvider + useAuth hook
├── hooks/
│   ├── useDevices.js                 # Device list + add/edit/remove
│   ├── useDevice.js                  # Single device fetch
│   ├── useWeather.js                 # Weather via browser geolocation
│   └── useWebSocket.js              # STOMP topic subscription management
├── services/
│   └── websocket.js                  # STOMP client singleton (SockJS transport)
├── pages/
│   ├── LoginPage.jsx                 # Public — email + password
│   ├── RegisterPage.jsx              # Public — name + email + password
│   ├── DashboardPage.jsx             # Protected — device grid + weather + add modal
│   └── DeviceDetailPage.jsx          # Protected — controls + telemetry + edit/delete
├── components/
│   ├── layout/  (Navbar, AppLayout)
│   ├── auth/    (ProtectedRoute)
│   ├── devices/ (DeviceCard, DeviceGrid, DeviceForm, DeviceModal, etc.)
│   ├── controls/(Toggle, Slider, Button, Dropdown, ColorPicker, ControlRenderer)
│   ├── weather/ (WeatherWidget)
│   └── ui/      (Modal, ConfirmDialog, LoadingSpinner, ErrorMessage)
├── utils/
│   ├── caseConverter.js              # Recursive snakeToCamel / camelToSnake
│   ├── formatters.js                 # Date/time formatting helpers
│   └── deviceIcons.js                # DeviceType → lucide icon + color
└── styles/
    └── index.css                     # Tailwind CSS directives
```

---

## Routes

| Path | Page | Auth | Description |
|------|------|------|-------------|
| `/login` | LoginPage | Public | Email + password sign in |
| `/register` | RegisterPage | Public | Name + email + password sign up |
| `/` | DashboardPage | Protected | Device grid + weather widget |
| `/devices/:id` | DeviceDetailPage | Protected | Device controls + live telemetry |

---

## Quick Start (Docker — Full Stack)

The fastest way to run everything. Requires Docker and Maven.

### 1. Build backend JARs

```bash
cd iot-backend
mvn clean install -DskipTests
```

### 2. Start all containers

```bash
cd iot-backend
WEATHER_API_KEY=your_key_here docker compose up --build -d
```

### 3. Open the app

http://localhost:3000

All 8 containers:

| Container | Port | Description |
|-----------|------|-------------|
| auth-db | 5432 | PostgreSQL — user accounts |
| device-db | 5433 | PostgreSQL — devices |
| discovery-server | 8761 | Eureka service registry |
| api-gateway | 8080 | Spring Cloud Gateway |
| auth-service | 8081 | Authentication + JWT |
| device-service | 8082 | Devices + MQTT + WebSocket |
| weather-service | 8084 | OpenWeatherMap proxy |
| **iot-frontend** | **3000** | **React app (nginx)** |

### Docker Architecture

```
                    Host :3000
                        │
              ┌─────────▼─────────┐
              │   iot-frontend     │
              │   (nginx :80)     │
              │                    │
              │  /api/* ──────────►├──── api-gateway:8080
              │  /api/ws ─────────►├──── api-gateway:8080 (WebSocket upgrade)
              │  /* ──────────────►│──── /usr/share/nginx/html/index.html
              └────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
   auth-service   device-service  weather-service
     :8081          :8082            :8084
         │              │
         ▼              ▼
      auth-db       device-db
    (PG :5432)     (PG :5432)
```

### Startup Order

Docker Compose handles ordering via `depends_on` + healthchecks:

```
auth-db, device-db          (start first, healthcheck: pg_isready)
         │
    discovery-server         (healthcheck: /actuator/health)
         │
    ┌────┼────┬──────────┐
    ▼    ▼    ▼          ▼
  auth  device weather  api-gateway
    │    │     │         │
    └────┴─────┴─────────┘
              │
        iot-frontend        (start after api-gateway)
```

### Stop / Clean Up

```bash
cd iot-backend

# Stop all containers
docker compose down

# Stop and delete database volumes
docker compose down -v
```

### Rebuild After Changes

```bash
# Frontend only
docker compose up --build iot-frontend -d

# Single backend service (rebuild JAR first)
mvn clean install -DskipTests -pl device-service -am
docker compose up --build device-service -d

# Everything
mvn clean install -DskipTests
docker compose up --build -d
```

---

## Quick Start (Local Development)

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ (`nvm use 20`) |
| PostgreSQL | 16 |
| Java | 17 |
| Maven | 3.8+ |

### 1. Set up databases

**Option A — Local PostgreSQL:**

```bash
sudo -u postgres psql
```

```sql
CREATE USER iot_user WITH PASSWORD 'iot_pass';
CREATE DATABASE auth_db OWNER iot_user;
CREATE DATABASE device_db OWNER iot_user;
\q
```

**Option B — Docker (databases only):**

```bash
cd iot-backend
docker compose up auth-db device-db -d
```

### 2. Build the backend

```bash
cd iot-backend
mvn clean install -DskipTests
```

### 3. Start backend services

Each in a separate terminal, in this order:

```bash
# Terminal 1 — Eureka
cd iot-backend/discovery-server
mvn spring-boot:run

# Terminal 2 — Auth
cd iot-backend/auth-service
mvn spring-boot:run

# Terminal 3 — Devices (use DB_PORT=5433 if using Docker databases)
cd iot-backend/device-service
DB_PORT=5433 mvn spring-boot:run

# Terminal 4 — Weather
cd iot-backend/weather-service
WEATHER_API_KEY=your_key_here mvn spring-boot:run

# Terminal 5 — Gateway
cd iot-backend/api-gateway
mvn spring-boot:run
```

### 4. Verify backend

Open http://localhost:8761 — you should see 4 services registered.

```bash
# Quick test
curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}' | jq .
```

### 5. Start frontend

```bash
cd iot-frontend
nvm use 20
npm install
npm run dev
```

Open http://localhost:3000. Vite proxies `/api/*` and WebSocket to `localhost:8080`.

---

## How the Frontend Connects to the Backend

### HTTP (Axios)

All API calls go through `src/api/axios.js`:

- **Base URL**: `/api` — proxied to `http://localhost:8080` by Vite (dev) or nginx (Docker)
- **Request interceptor**: attaches `Authorization: Bearer <token>`, converts body keys to snake_case
- **Response interceptor**: converts response keys to camelCase
- **401 handler**: attempts token refresh, queues concurrent failures, redirects to `/login` on failure

### Auth Flow

```
Register/Login
     │
     ▼
POST /api/auth/register  or  POST /api/auth/login
     │
     ▼
Response: { token, refresh_token, user: { id, email, name } }
     │
     ▼
Store token + refreshToken + user in localStorage
     │
     ▼
Decode JWT exp → schedule refresh 5 min before expiry
     │
     ▼
On app mount → GET /api/auth/me → validate stored token
     │
     ▼
On 401 → POST /api/auth/refresh → retry original request
```

### WebSocket (STOMP over SockJS)

```
Browser                          Gateway                    Device Service
   │                                │                            │
   │── SockJS connect /api/ws ─────►│── StripPrefix ── /ws ────►│
   │                                │   (no JWT filter)          │
   │◄── STOMP CONNECTED ───────────────────────────────────────►│
   │                                                             │
   │── SUBSCRIBE /topic/devices/{id}/status ───────────────────►│
   │── SUBSCRIBE /topic/devices/{id}/control ──────────────────►│
   │── SUBSCRIBE /topic/devices/{id}/telemetry ────────────────►│
   │                                                             │
   │◄── MESSAGE { is_online: true } ──────────────────────────◄─│
   │◄── MESSAGE { control_id, value } ────────────────────────◄─│
   │◄── MESSAGE { temperature: 22.5 } ────────────────────────◄─│
```

### STOMP Topics

| Topic | Payload | Used In |
|-------|---------|---------|
| `/topic/devices/{id}/status` | `{ is_online: boolean }` | DashboardPage, DeviceDetailPage |
| `/topic/devices/{id}/control` | `{ control_id, value }` | DeviceDetailPage |
| `/topic/devices/{id}/telemetry` | arbitrary JSON | DeviceDetailPage |

---

## API Endpoints

### Auth (`/api/auth`)

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/api/auth/login` | No | `{ email, password }` | `{ token, refresh_token, user }` |
| POST | `/api/auth/register` | No | `{ name, email, password }` | `{ token, refresh_token, user }` |
| POST | `/api/auth/refresh` | Yes | — | `{ token, refresh_token, user }` |
| GET | `/api/auth/me` | Yes | — | `{ id, email, name, profile_image_url }` |

### Devices (`/api/devices`)

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | `/api/devices` | Yes | — | `[ DeviceDto, ... ]` |
| GET | `/api/devices/{id}` | Yes | — | `DeviceDto` |
| POST | `/api/devices` | Yes | `CreateDeviceRequest` | `DeviceDto` (201) |
| PUT | `/api/devices/{id}` | Yes | `UpdateDeviceRequest` | `DeviceDto` |
| DELETE | `/api/devices/{id}` | Yes | — | 204 No Content |

**DeviceDto** (snake_case over the wire, camelCase in frontend):
```json
{
  "id": "uuid",
  "name": "Living Room Light",
  "type": "LIGHT",
  "is_online": false,
  "mqtt_topic_prefix": "home/livingroom",
  "location": { "latitude": 12.97, "longitude": 77.59, "address": "123 Main St", "label": "Kitchen" },
  "controls": [{
    "id": "uuid", "name": "Power", "control_type": "TOGGLE",
    "current_value": "true", "min_value": null, "max_value": null,
    "step": null, "options": [], "mqtt_topic": "home/livingroom/power"
  }],
  "created_at": 1708531200000,
  "updated_at": 1708531200000
}
```

**Device Types**: `LIGHT` `THERMOSTAT` `SWITCH` `SENSOR` `CAMERA` `LOCK` `FAN` `CUSTOM`

**Control Types**: `TOGGLE` `SLIDER` `BUTTON` `DROPDOWN` `COLOR_PICKER`

### Weather (`/api/weather`)

| Method | Path | Auth | Params | Response |
|--------|------|------|--------|----------|
| GET | `/api/weather` | Yes | `lat`, `lon`, `units` (default: metric) | OpenWeatherMap JSON |

---

## Environment Variables (Backend)

| Variable | Default | Services | Description |
|----------|---------|----------|-------------|
| `JWT_SECRET` | `default-secret-key-...` | All | JWT signing key (min 256 bits). **Must match across all services.** |
| `JWT_ACCESS_EXPIRATION` | `3600000` (1h) | Auth, Device, Weather | Access token lifetime (ms) |
| `JWT_REFRESH_EXPIRATION` | `604800000` (7d) | Auth, Device, Weather | Refresh token lifetime (ms) |
| `DB_HOST` | `localhost` | Auth, Device | PostgreSQL host |
| `DB_PORT` | `5432` | Auth, Device | PostgreSQL port |
| `DB_NAME` | `auth_db` / `device_db` | Auth, Device | Database name |
| `DB_USERNAME` | `iot_user` | Auth, Device | Database user |
| `DB_PASSWORD` | `iot_pass` | Auth, Device | Database password |
| `EUREKA_URI` | `http://localhost:8761/eureka/` | All | Service discovery URL |
| `MQTT_BROKER_URL` | `tcp://broker.hivemq.com:1883` | Device | MQTT broker |
| `WEATHER_API_KEY` | _(empty)_ | Weather | OpenWeatherMap API key — **required** |

---

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Eureka Discovery | 8761 | http://localhost:8761 |
| API Gateway | 8080 | http://localhost:8080 |
| Auth Service | 8081 | http://localhost:8081 |
| Device Service | 8082 | http://localhost:8082 |
| Weather Service | 8084 | http://localhost:8084 |
| **Frontend** | **3000** | **http://localhost:3000** |

---

## Production Build (Without Docker)

```bash
cd iot-frontend
npm run build
```

Output goes to `dist/`. Serve with any static file server and proxy `/api` to the gateway.

---

## Frontend Docker Compose

The `docker-compose.yml` in this directory builds and runs **only the frontend** container. Use it when you want to deploy the frontend independently from the backend stack.

### Prerequisites

- Docker and Docker Compose installed
- Backend services running via `iot-backend/docker-compose.yml` (the frontend container joins the backend's default network to reach `api-gateway`)

---

### Running Locally (Development / Testing)

Use this to test the production Docker image on your local machine.

**1. Start the backend first** (this creates the `iot-backend_default` network):

```bash
cd iot-backend
WEATHER_API_KEY=your_key_here docker compose up --build -d
```

> The frontend compose references the backend's default network (`iot-backend_default`) as an external network. The backend must be running before starting the frontend.

**3. Build and start the frontend:**

```bash
cd iot-frontend
docker compose up --build -d
```

**4. Open the app:** http://localhost

**5. View logs:**

```bash
docker compose logs -f iot-frontend
```

**6. Stop:**

```bash
docker compose down
```

---

### Deploying to a Server

**1. SSH into your server and clone the repo:**

```bash
git clone <your-repo-url>
cd iot-frontend
```

**2. Start the backend** (must be running first — it creates the `iot-backend_default` network):

```bash
cd iot-backend
WEATHER_API_KEY=your_key_here docker compose up --build -d
```

**3. (Optional) Update `nginx.conf` for your domain:**

If you're serving behind a reverse proxy or using a custom domain, update the `server_name` directive:

```nginx
server_name yourdomain.com;
```

If the API gateway is on a different host/IP, update the `proxy_pass` directives:

```nginx
proxy_pass http://<gateway-host>:8080/api/;
```

**4. Build and start:**

```bash
docker compose up --build -d
```

**5. Verify it's running:**

```bash
docker compose ps
```

Expected output:

```
NAME            IMAGE                    STATUS         PORTS
iot-frontend    iot-frontend-iot-frontend Up (healthy)   0.0.0.0:80->80/tcp
```

**6. (Optional) Change the host port:**

If port 80 is already in use, edit `docker-compose.yml`:

```yaml
ports:
  - "3000:80"   # or any available port
```

Then restart:

```bash
docker compose up -d
```

---

### With HTTPS (Production)

For production, place a reverse proxy (e.g., Nginx, Caddy, Traefik) in front of the frontend container to handle SSL termination.

**Example with Caddy** (automatic HTTPS):

```bash
# Caddyfile
yourdomain.com {
    reverse_proxy localhost:80
}
```

**Example with Nginx** (host-level):

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket upgrade
    location /api/ws {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

### Rebuild After Frontend Changes

```bash
cd iot-frontend
docker compose up --build -d
```

### Docker Compose Reference

| Setting | Value | Description |
|---------|-------|-------------|
| Service name | `iot-frontend` | Container name |
| Build context | `.` (current dir) | Uses `./Dockerfile` |
| Host port | `80` | Mapped to container port 80 |
| Network | `iot-backend_default` (external) | Joins the backend's default Docker Compose network |
| Restart policy | `unless-stopped` | Auto-restart on crash or reboot |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm run dev` fails | Ensure Node 18+: `node --version`. Use `nvm use 20`. |
| API calls return 502 | Backend services not running. Check Eureka at http://localhost:8761. |
| 401 on every request | JWT secret mismatch. Ensure `JWT_SECRET` is identical across all services. |
| WebSocket won't connect | Ensure device-service is running and registered in Eureka. |
| Weather shows nothing | Set `WEATHER_API_KEY` on weather-service. Allow browser geolocation. |
| Database connection refused | Start PostgreSQL or `docker compose up auth-db device-db -d`. |
| CORS errors | Should not happen with Vite/nginx proxy. In production, configure gateway CORS. |
| Docker build fails on backend | Run `mvn clean install -DskipTests` first — Dockerfiles need pre-built JARs. |
| Frontend container shows 502 | Gateway not ready yet. Wait for Eureka to register all services. |
| WebSocket 504 in Docker | Check `proxy_read_timeout` in `nginx.conf` (default: 86400s). |
| `iot-backend_default` not found | Start the backend first: `cd iot-backend && docker compose up -d`. The network is created automatically. |
| Frontend can't reach `api-gateway` | Ensure backend is running and both are on `iot-backend_default`. Verify with `docker network inspect iot-backend_default`. |
| Port 80 already in use | Change the host port in `docker-compose.yml`: `"3000:80"` instead of `"80:80"`. |
| Changes not reflected after rebuild | Run `docker compose up --build -d` (the `--build` flag is required to rebuild the image). |
