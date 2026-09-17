# GameHub Deployment Guide

This repository contains a fullstack application consisting of a React + Vite frontend (`client`) and a Node.js + Express + Socket.IO backend (`server`). Because it relies on stateful WebSocket connections, you must deploy the frontend and backend separately and ensure the backend supports WebSockets.

## Backend Deployment (Server on Render)

The backend is a stateful Node.js + Socket.IO server.

1. Create a new **Web Service** on Render.
2. Connect your Git repository.
3. **Root Directory**: *(Leave blank)*
4. **Build Command**: 
   ```bash
   npm install && npm run build:server
   ```
5. **Start Command**: 
   ```bash
   npm run start --workspace=server
   ```
6. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: (Render automatically assigns `PORT`, code defaults to 3001 if absent).
   - *(Optional)* `CORS_ORIGIN`: `https://<your-client>.onrender.com`

---

## Frontend Deployment (Client on Render)

The frontend is a static React application built with Vite.

1. Create a new **Static Site** on Render.
2. Connect the same Git repository.
3. **Root Directory**: *(Leave blank)*
4. **Build Command**: 
   ```bash
   npm install && npm run build:client
   ```
5. **Publish Directory**: 
   ```bash
   client/dist
   ```
6. **Environment Variables**:
   - `VITE_SERVER_URL`: `https://<your-backend-name>.onrender.com` (your deployed backend URL)
7. **SPA Redirect / Rewrite**:
   - In Static Site settings -> **Redirects/Rewrites**, add:
     - **Type**: `Rewrite`
     - **Source**: `/*`
     - **Destination**: `/index.html`

---

## Handling Disconnects and State
Currently, the room state is kept in-memory. If the backend restarts (or wakes up from free-tier sleep after 15m of inactivity), all active rooms will reset. Socket.IO will automatically attempt reconnects.
