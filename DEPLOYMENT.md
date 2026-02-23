# IoT Frontend - Server Deployment Guide

## Network Scenario

```
                    ┌──────────────┐
                    │   Router     │
                    │ 192.168.x.1  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │                         │
     ┌────────┴────────┐     ┌─────────┴────────┐
     │  Ubuntu Server   │     │  Client PC        │
     │  192.168.x.100   │     │  192.168.x.101    │
     │                  │     │                   │
     │  Runs:           │     │  Connects via:    │
     │  - Backend stack │     │  - SSH (setup)    │
     │  - Frontend :3000│     │  - Browser :3000  │
     └──────────────────┘     └───────────────────┘
```

> Replace `192.168.x.100` with your actual server IP throughout this guide.

---

## Prerequisites

- **Backend must be deployed first** — the frontend Docker container joins the backend's Docker network (`iot-backend_default`) and proxies API requests to `api-gateway:8080`
- Ubuntu Server with Docker and Docker Compose already installed (see [iot-backend DEPLOYMENT.md](../iot-backend/DEPLOYMENT.md) for PHASE 1–3)
- SSH access to the server

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│  Docker Network: iot-backend_default                    │
│                                                         │
│  ┌───────────────┐          ┌────────────────────────┐  │
│  │ iot-frontend   │  /api/  │  api-gateway           │  │
│  │ (nginx :80)    │────────►│  (:8080)               │  │
│  │                │         │                        │  │
│  │ Serves:        │  /api/ws│  Routes to:            │  │
│  │ - React SPA    │────────►│  - auth-service        │  │
│  │ - Proxies API  │ (WS)   │  - device-service      │  │
│  │                │         │  - weather-service     │  │
│  └───────────────┘          └────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

- **Nginx** serves the built React app as static files
- `/api/*` requests are reverse-proxied to the `api-gateway` container
- `/api/ws` WebSocket connections are upgraded and proxied for real-time updates
- All other routes fall back to `index.html` (SPA routing)

---

## PHASE 1: Transfer Frontend to Server (via SSH)

> Assumes you already have SSH access and Docker installed on the server (from backend deployment).

### Step 1: Transfer the Project Files

Choose one of these options:

#### Option A: Clone from Git (Recommended)

```bash
ssh deployer@192.168.x.100
cd ~
git clone <your-repo-url>/iot-frontend.git
```

#### Option B: Copy from Client PC using SCP

Open a terminal on your **Client PC**:

```bash
scp -r /path/to/iot-frontend deployer@192.168.x.100:~/iot-frontend
```

#### Option C: Copy using rsync (faster, resumes on failure)

From your **Client PC**:

```bash
rsync -avz --progress /path/to/iot-frontend deployer@192.168.x.100:~/
```

### Step 2: Verify Folder Structure

In your SSH session:

```bash
ls -la ~/iot-frontend/
```

Expected structure:

```
~/iot-frontend/
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── package.json
├── package-lock.json
├── src/
├── public/
└── ...
```

---

## PHASE 2: Verify Backend is Running

The frontend **depends on the backend network**. Confirm the backend is up:

```bash
cd ~/iot-backend
docker compose ps
```

All backend containers should show `Up` (especially `api-gateway`).

Verify the network exists:

```bash
docker network ls | grep iot-backend_default
```

Expected output:

```
<network-id>   iot-backend_default   bridge    local
```

> If the backend is not running, start it first:
> ```bash
> cd ~/iot-backend
> mvn clean package -DskipTests
> docker compose up -d --build
> ```

---

## PHASE 3: Build and Deploy Frontend (via SSH)

### Step 3: Configure Firewall

Port 3000 is already allowed from the backend deployment — no additional firewall rules needed.

Verify:

```bash
sudo ufw status
```

Expected (already configured):

```
To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
3000/tcp                   ALLOW       Anywhere
8080/tcp                   ALLOW       Anywhere
8761/tcp                   ALLOW       Anywhere
```

### Changing the Frontend Port (Optional)

The default port is `3000`. To use a different port (e.g., `8090`), update `docker-compose.yml`:

```yaml
ports:
  - "8090:80"    # change 8090 to your desired port
```

Then allow it in the firewall:

```bash
sudo ufw allow 8090/tcp
```

> Remember to use the new port in all URLs (e.g., `http://192.168.x.100:8090`).

### Step 4: Build Docker Image and Start Container

```bash
cd ~/iot-frontend

# Build and start in background
docker compose up -d --build
```

This will:
1. Build the React app using Node 20 Alpine (multi-stage build)
2. Copy the production build into an Nginx Alpine container
3. Apply the `nginx.conf` for API proxying and SPA routing
4. Join the `iot-backend_default` Docker network
5. Start serving on port 3000 (mapped to nginx port 80 inside the container)

### Step 5: Monitor Startup

```bash
# Watch logs
docker compose logs -f

# Or check status
docker compose ps
```

Expected output:

```
NAME             STATUS    PORTS
iot-frontend     Up        0.0.0.0:3000->80/tcp
```

### Step 6: Verify Deployment (from SSH session)

```bash
# Check frontend is serving
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Expected: 200

# Check API proxy is working
curl -s http://localhost:3000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"pitabash@example.com","password":"password123"}'
# Expected: JSON response with access_token
```

---

## PHASE 4: Access from Client PC (Browser)

Open a browser on your **Client PC** and navigate to:

### Frontend (Web UI)

```
http://192.168.x.100:3000
```

### Default Test Users

| Email                  | Password      |
|------------------------|---------------|
| pitabash@example.com   | password123   |
| john@example.com       | password123   |
| jane@example.com       | password123   |

---

## Managing the Deployment (via SSH)

SSH into the server first:

```bash
ssh deployer@192.168.x.100
cd ~/iot-frontend
```

### Stop the frontend

```bash
docker compose down
```

### Restart the frontend

```bash
docker compose restart
```

### View logs

```bash
docker compose logs -f
docker compose logs --tail=100 iot-frontend
```

### Rebuild after code changes

```bash
docker compose up -d --build
```

### Auto-start on Server Boot

```bash
# Enable Docker to start on boot (if not already)
sudo systemctl enable docker

# Set restart policy
docker update --restart unless-stopped iot-frontend
```

### Check Resource Usage

```bash
# Container resource usage
docker stats --no-stream iot-frontend

# Disk space used by Docker images
docker images | grep iot-frontend
```

---

## Updating the Application

When you have code changes to deploy:

### Option A: Pull from Git

```bash
ssh deployer@192.168.x.100
cd ~/iot-frontend
git pull origin main
docker compose up -d --build
```

### Option B: Push from Client PC via rsync

From your **Client PC**:

```bash
rsync -avz --progress /path/to/iot-frontend/ deployer@192.168.x.100:~/iot-frontend/
```

Then in your **SSH session**:

```bash
cd ~/iot-frontend
docker compose up -d --build
```

> No Maven build needed — the Dockerfile handles `npm ci` and `npm run build` inside the container.

---

## Troubleshooting

### Frontend shows blank page or 502

```bash
# Check container is running
docker compose ps

# Check nginx logs
docker compose logs --tail=50 iot-frontend
```

### API calls return 502 Bad Gateway

The frontend cannot reach the `api-gateway` container. Check:

```bash
# 1. Backend is running
cd ~/iot-backend && docker compose ps

# 2. Frontend is on the same network
docker network inspect iot-backend_default | grep iot-frontend

# 3. api-gateway is reachable from frontend container
docker exec iot-frontend wget -qO- http://api-gateway:8080/actuator/health
```

### WebSocket connection fails

```bash
# Check nginx config is correctly applied
docker exec iot-frontend cat /etc/nginx/conf.d/default.conf

# Check api-gateway WebSocket endpoint
docker exec iot-frontend wget -qO- http://api-gateway:8080/api/ws/info
```

### Frontend not joining backend network

```bash
# Verify network exists
docker network ls | grep iot-backend_default

# If not, start backend first
cd ~/iot-backend
docker compose up -d --build

# Then restart frontend
cd ~/iot-frontend
docker compose up -d --build
```

### Port 3000 already in use

```bash
# Check what's using port 3000
sudo ss -tlnp | grep :3000

# Kill the process or change the port mapping in docker-compose.yml
# Restart frontend
docker compose up -d
```

### Container keeps restarting

```bash
# Check logs for errors
docker compose logs --tail=50 iot-frontend

# Common causes:
# - npm build failed → check for missing dependencies
# - nginx.conf syntax error → docker exec iot-frontend nginx -t
```

### SSH session disconnects during build

Use `tmux` to keep processes running:

```bash
sudo apt install -y tmux
tmux new -s deploy
# Run your commands inside tmux...
docker compose up -d --build
# Detach: press Ctrl+B, then D
# Reattach later: tmux attach -t deploy
```

---

## Quick Reference Card

### SSH into server
```bash
ssh deployer@192.168.x.100
```

### Full deploy (from SSH session)
```bash
cd ~/iot-frontend
git pull origin main
docker compose up -d --build
```

### Check status
```bash
docker compose ps
docker compose logs -f
```

### Access URL (from client browser)
```
http://192.168.x.100:3000
```

---

## Port Reference

| Port | Service         | Exposed to Network? | Purpose                    |
|------|-----------------|---------------------|----------------------------|
| 3000 | Frontend (nginx)| Yes                 | Web UI + API proxy         |
| 8080 | API Gateway     | Yes (via backend)   | Direct API access          |

> All API traffic from the browser goes through port 3000 (nginx proxies `/api/*` to the gateway internally).
>
> **Note:** The frontend port (3000) can be changed in `docker-compose.yml` — see [Changing the Frontend Port](#changing-the-frontend-port-optional).

---

## Minimum Server Requirements

> Same as backend — the frontend adds minimal overhead (~30MB container).

| Resource | Minimum   | Recommended |
|----------|-----------|-------------|
| RAM      | 4 GB      | 8 GB        |
| CPU      | 2 cores   | 4 cores     |
| Disk     | 20 GB     | 50 GB       |
| OS       | Ubuntu 20.04+ | Ubuntu 22.04 LTS |

---

## Full Stack Deploy (Both Backend + Frontend)

If deploying everything from scratch on a fresh server:

```bash
# 1. Clone both repos
cd ~
git clone <your-repo-url>/iot-backend.git
git clone <your-repo-url>/iot-frontend.git

# 2. Build and start backend
cd ~/iot-backend
mvn clean package -DskipTests
docker compose up -d --build

# 3. Wait for backend to be healthy (~2-3 minutes)
docker compose ps   # all should show "Up"

# 4. Seed databases (first time only)
docker exec -i auth-db psql -U iot_user -d auth_db < init-auth-db.sql
docker exec -i device-db psql -U iot_user -d device_db < init-device-db.sql

# 5. Start frontend
cd ~/iot-frontend
docker compose up -d --build

# 6. Verify
curl -s http://localhost:3000/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"pitabash@example.com","password":"password123"}'
```

Access from browser: `http://192.168.x.100:3000`
