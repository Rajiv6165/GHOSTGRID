# GHOSTGRID
Real-time collaborative architecture whiteboard with AI-assisted diagram generation. Built with Next.js, Django Channels, WebSockets, and OpenAI. Features live multi-user sync, drag-and-drop nodes/edges, and an AI design command — all powered by Redis pub/sub and a REST + WebSocket API.

## Windows Quick Start

### Prerequisites

- Windows 10/11
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git installed

### 1) Clone and enter the project

```powershell
git clone https://github.com/Rajiv6165/GHOSTGRID.git
cd GHOSTGRID
```

### 2) Start the full stack

```powershell
docker-compose up -d
```

### 3) Open the app

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Django Admin: `http://localhost:8000/admin`

### 4) Check service status

```powershell
docker-compose ps
```

### 5) View logs (if something fails)

```powershell
docker-compose logs -f
```

### 6) Stop services

```powershell
docker-compose down
```

---

## Deployment Guide

This project is configured for deployment to **Render** (backend ASGI service via Docker) and **Vercel** (frontend Next.js app).

### 1. Render Backend Deployment

The backend runs as a Django + Daphne ASGI server container.

#### Option A: Deploy via Blueprint (Recommended)
1. Go to the [Render Dashboard](https://dashboard.render.com/) and click **New** -> **Blueprint**.
2. Connect your GitHub repository.
3. Render will auto-detect the `render.yaml` file.
4. Set the value for `GEMINI_API_KEY`.
5. Click **Approve**. Render will automatically provision the Docker web service.

#### Option B: Manual Docker Deployment
1. Click **New** -> **Web Service** -> **Build and deploy from a Git repository**.
2. Connect the repository and set the following:
   - **Language**: `Docker`
   - **Docker Context**: `ghostgrid-backend`
   - **Dockerfile Path**: `ghostgrid-backend/Dockerfile`
3. Add the following **Environment Variables**:
   - `GEMINI_API_KEY`: *(Your Google AI Studio Gemini API Key)*
   - `SECRET_KEY`: *(A long, secure random string)*
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: `*` (or your specific backend domain name once deployed)
   - `CORS_ALLOWED_ORIGINS`: `https://your-frontend.vercel.app` (set this to your Vercel frontend URL once deployed)
   - *(Optional)* To run with PostgreSQL and Redis instead of SQLite and memory channels, set the standard DB variables (`POSTGRES_HOST`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`) and Redis host/port (`REDIS_HOST`, `REDIS_PORT`).

---

### 2. Vercel Frontend Deployment

The frontend is a Next.js application.

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New** -> **Project**.
2. Select your repository.
3. In the project setup, configure:
   - **Root Directory**: `ghostgrid-frontend` (Vercel will auto-detect Next.js)
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_BACKEND_URL`: The HTTPS URL of your deployed Render backend (e.g., `https://ghostgrid-backend.onrender.com`)
   - `NEXT_PUBLIC_WS_URL`: The WSS URL of your deployed Render backend (e.g., `wss://ghostgrid-backend.onrender.com`)
5. Click **Deploy**.

