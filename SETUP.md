# IoT Frontend — Setup & Architecture

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
                        │ (Vite proxy)               │ (Vite proxy)
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

## Frontend Structure

```
iot-frontend/src/
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

## Routes

| Path | Page | Auth | Description |
|------|------|------|-------------|
| `/login` | LoginPage | Public | Email + password sign in |
| `/register` | RegisterPage | Public | Name + email + password sign up |
| `/` | DashboardPage | Protected | Device grid + weather widget |
| `/devices/:id` | DeviceDetailPage | Protected | Device controls + live telemetry |

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | Use `nvm use 20` if available |
| npm | 10+ | Comes with Node 20 |
| PostgreSQL | 16 | Two databases: `auth_db`, `device_db` |
| IoT Backend | — | All 5 services running |

---

## Step 1 — Set Up the Databases

Create two PostgreSQL databases and a shared user:

```bash
sudo -u postgres psql
```

```sql
CREATE USER iot_user WITH PASSWORD 'iot_pass';
CREATE DATABASE auth_db OWNER iot_user;
CREATE DATABASE device_db OWNER iot_user;
\q
```

Or use Docker:

```bash
# From the backend directory
cd iot-backend
docker compose up auth-db device-db -d
```

This starts:
- `auth-db` on port **5432**
- `device-db` on port **5433**

---

## Step 2 — Build the Backend

```bash
cd iot-backend
mvn clean install -DskipTests
```

This builds all 6 modules: `common-lib`, `discovery-server`, `api-gateway`, `auth-service`, `device-service`, `weather-service`.

---

## Step 3 — Start Backend Services

Start services **in this order** (each in a separate terminal):

### 3a. Discovery Server (Eureka)

```bash
cd iot-backend/discovery-server
mvn spring-boot:run
```

Wait until you see `Started EurekaServerApplication`. Verify at http://localhost:8761.

### 3b. Auth Service

```bash
cd iot-backend/auth-service
mvn spring-boot:run
```

### 3c. Device Service

If using Docker databases, set `DB_PORT=5433`:

```bash
cd iot-backend/device-service
DB_PORT=5433 mvn spring-boot:run
```

If using local PostgreSQL (both DBs on 5432):

```bash
cd iot-backend/device-service
mvn spring-boot:run
```

### 3d. Weather Service

Get a free API key from https://openweathermap.org/api and run:

```bash
cd iot-backend/weather-service
WEATHER_API_KEY=your_key_here mvn spring-boot:run
```

### 3e. API Gateway

```bash
cd iot-backend/api-gateway
mvn spring-boot:run
```

### Alternatively — Start Everything with Docker Compose

```bash
cd iot-backend
WEATHER_API_KEY=your_key_here docker compose up --build -d
```

---

## Step 4 — Verify Backend

Check Eureka dashboard at http://localhost:8761 — you should see 4 services registered:
- `AUTH-SERVICE`
- `DEVICE-SERVICE`
- `WEATHER-SERVICE`
- `API-GATEWAY`

Quick API test:

```bash
# Register a user
curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}' | jq .

# Login
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq .
```

---

## Step 5 — Install Frontend Dependencies

```bash
cd iot-frontend
nvm use 20       # if using nvm
npm install
```

---

## Step 6 — Start Frontend Dev Server

```bash
cd iot-frontend
npm run dev
```

Open http://localhost:3000 in your browser.

The Vite dev server proxies all `/api/*` requests and WebSocket connections to `localhost:8080` (the gateway), so there are no CORS issues during development.

---

## Backend Environment Variables Reference

| Variable | Default | Services | Description |
|----------|---------|----------|-------------|
| `JWT_SECRET` | `default-secret-key-...` | Gateway, Auth, Device, Weather | JWT signing key (min 256 bits). **Must be identical across all services.** |
| `JWT_ACCESS_EXPIRATION` | `3600000` (1h) | Auth, Device, Weather | Access token lifetime in ms |
| `JWT_REFRESH_EXPIRATION` | `604800000` (7d) | Auth, Device, Weather | Refresh token lifetime in ms |
| `DB_HOST` | `localhost` | Auth, Device | PostgreSQL host |
| `DB_PORT` | `5432` | Auth, Device | PostgreSQL port (use `5433` for device-db with Docker) |
| `DB_NAME` | `auth_db` / `device_db` | Auth, Device | Database name |
| `DB_USERNAME` | `iot_user` | Auth, Device | Database user |
| `DB_PASSWORD` | `iot_pass` | Auth, Device | Database password |
| `EUREKA_URI` | `http://localhost:8761/eureka/` | All | Eureka discovery URL |
| `MQTT_BROKER_URL` | `tcp://broker.hivemq.com:1883` | Device | MQTT broker (default: public HiveMQ) |
| `MQTT_CLIENT_ID` | `iot-device-service` | Device | MQTT client identifier |
| `WEATHER_API_KEY` | _(empty)_ | Weather | OpenWeatherMap API key — **required** |

---

## How the Frontend Connects to the Backend

### HTTP Requests (Axios)

All API calls go through `src/api/axios.js`, which provides:

1. **Base URL**: `/api` — Vite proxies this to `http://localhost:8080` in development
2. **Request interceptor**: attaches `Authorization: Bearer <token>` header and converts request body keys from camelCase to snake_case
3. **Response interceptor**: converts response body keys from snake_case to camelCase
4. **401 handler**: on token expiry, attempts `POST /api/auth/refresh`, queues concurrent failed requests, retries them all after refresh, redirects to `/login` if refresh fails

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
Decode JWT exp → schedule refresh 5 minutes before expiry
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
   │◄── MESSAGE { is_online: true } ──────────────────────────◄─│ (MQTT → STOMP bridge)
   │◄── MESSAGE { control_id, value } ────────────────────────◄─│
   │◄── MESSAGE { temperature: 22.5 } ────────────────────────◄─│
```

The WebSocket route has **no JWT filter** at the gateway — it connects without authentication.

### STOMP Topics

| Topic | Payload | Used In |
|-------|---------|---------|
| `/topic/devices/{id}/status` | `{ is_online: boolean }` | DashboardPage (all devices), DeviceDetailPage |
| `/topic/devices/{id}/control` | `{ control_id, value }` | DeviceDetailPage |
| `/topic/devices/{id}/telemetry` | arbitrary JSON | DeviceDetailPage |

---

## API Endpoints Used by Frontend

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

**DeviceDto** (snake_case over the wire, camelCase in frontend code):
```json
{
  "id": "uuid",
  "name": "Living Room Light",
  "type": "LIGHT",
  "is_online": false,
  "mqtt_topic_prefix": "home/livingroom",
  "location": {
    "latitude": 12.97,
    "longitude": 77.59,
    "address": "123 Main St",
    "label": "Kitchen"
  },
  "controls": [
    {
      "id": "uuid",
      "name": "Power",
      "control_type": "TOGGLE",
      "current_value": "true",
      "min_value": null,
      "max_value": null,
      "step": null,
      "options": [],
      "mqtt_topic": "home/livingroom/power"
    }
  ],
  "created_at": 1708531200000,
  "updated_at": 1708531200000
}
```

**Device Types**: `LIGHT`, `THERMOSTAT`, `SWITCH`, `SENSOR`, `CAMERA`, `LOCK`, `FAN`, `CUSTOM`

**Control Types**: `TOGGLE`, `SLIDER`, `BUTTON`, `DROPDOWN`, `COLOR_PICKER`

### Weather (`/api/weather`)

| Method | Path | Auth | Params | Response |
|--------|------|------|--------|----------|
| GET | `/api/weather` | Yes | `lat`, `lon`, `units` (default: metric) | OpenWeatherMap JSON |

---

## Service Ports Summary

| Service | Port | URL |
|---------|------|-----|
| Eureka Discovery | 8761 | http://localhost:8761 |
| API Gateway | 8080 | http://localhost:8080 |
| Auth Service | 8081 | http://localhost:8081 |
| Device Service | 8082 | http://localhost:8082 |
| Weather Service | 8084 | http://localhost:8084 |
| **Frontend (Vite)** | **3000** | **http://localhost:3000** |

---

## Docker Deployment

### Files

| File | Purpose |
|------|---------|
| `iot-frontend/Dockerfile` | Multi-stage build: Node 20 (build) + nginx (serve) |
| `iot-frontend/nginx.conf` | Proxies `/api/*` and `/api/ws` to `api-gateway`, SPA fallback for all other routes |
| `iot-frontend/.dockerignore` | Excludes `node_modules`, `dist`, `.git` from build context |
| `iot-backend/docker-compose.yml` | Full stack — databases + backend services + frontend |

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

### Run the Full Stack

**1. Build the backend JARs first** (required — backend Dockerfiles copy pre-built JARs):

```bash
cd iot-backend
mvn clean install -DskipTests
```

**2. Start everything:**

```bash
cd iot-backend
WEATHER_API_KEY=your_key_here docker compose up --build -d
```

**3. Check status:**

```bash
docker compose ps
```

All 8 containers should be running:

| Container | Image | Port |
|-----------|-------|------|
| auth-db | postgres:16-alpine | 5432 |
| device-db | postgres:16-alpine | 5433 |
| discovery-server | iot-backend-discovery-server | 8761 |
| api-gateway | iot-backend-api-gateway | 8080 |
| auth-service | iot-backend-auth-service | 8081 |
| device-service | iot-backend-device-service | 8082 |
| weather-service | iot-backend-weather-service | 8084 |
| iot-frontend | iot-backend-iot-frontend | 3000 |

**4. Open the app:** http://localhost:3000

### Run Frontend Separately

If you want to run only the frontend container (backend already running on host):

```bash
cd iot-frontend
docker build -t iot-frontend .
docker run -p 3000:80 --network host iot-frontend
```

> With `--network host`, nginx resolves `api-gateway` to `localhost`. If the gateway is on a different host, edit `nginx.conf` and replace `api-gateway` with the actual hostname/IP.

### Startup Order

Docker Compose handles the startup order via `depends_on`:

```
auth-db, device-db          (start first, healthcheck: pg_isready)
         │
    discovery-server         (start after DBs, healthcheck: /actuator/health)
         │
    ┌────┼────┬──────────┐
    ▼    ▼    ▼          ▼
  auth  device weather  api-gateway
    │    │     │         │
    └────┴─────┴─────────┘
              │
        iot-frontend        (start after api-gateway)
```

### Stop and Clean Up

```bash
# Stop all containers
cd iot-backend
docker compose down

# Stop and remove volumes (deletes all database data)
docker compose down -v
```

### Rebuild After Code Changes

```bash
# Frontend only
docker compose up --build iot-frontend -d

# Backend service (e.g. device-service) — rebuild JAR first
cd iot-backend
mvn clean install -DskipTests -pl device-service -am
docker compose up --build device-service -d

# Everything
mvn clean install -DskipTests
docker compose up --build -d
```

---

## Production Build (Without Docker)

```bash
cd iot-frontend
npm run build
```

Output goes to `dist/`. Serve with any static file server, or configure your gateway/nginx to serve the static files and proxy `/api` to the gateway.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm run dev` fails | Ensure Node 18+: `node --version`. Use `nvm use 20`. |
| API calls return 502 | Backend services not running. Check Eureka at http://localhost:8761. |
| 401 on every request | JWT secret mismatch between services. Ensure `JWT_SECRET` is identical everywhere. |
| WebSocket won't connect | Ensure device-service is running and registered in Eureka. Check `/api/ws` route. |
| Weather shows nothing | Set `WEATHER_API_KEY` env var on weather-service. Allow browser geolocation when prompted. |
| Database connection refused | Start PostgreSQL or run `docker compose up auth-db device-db -d`. |
| CORS errors | Should not happen with Vite proxy or nginx proxy. In production, configure CORS on the gateway. |
| Login returns snake_case error | This is expected — the axios interceptor auto-converts responses to camelCase. |
| Docker build fails on backend | Run `mvn clean install -DskipTests` first — backend Dockerfiles need pre-built JARs. |
| Frontend container shows 502 | The `api-gateway` container is not ready yet. Wait for Eureka to register all services. |
| WebSocket 504 in Docker | Ensure `proxy_read_timeout` is high in `nginx.conf` (set to 86400s by default). |
