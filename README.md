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
