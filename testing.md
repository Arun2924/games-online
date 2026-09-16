# Local Development & Deployment Guide

This document explains how to run the GameHub project locally on your machine (localhost) and how to configure it for online deployment.

## 1. Running on Localhost

This project uses npm workspaces to manage the `client` (frontend), `server` (backend), and `shared` code. You can start the entire application from the root directory.

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.

### Steps to Run Locally

1. **Install Dependencies**
   Open your terminal in the root directory of the project and run:
   ```bash
   npm install
   ```

2. **Start the Development Server**
   Run the following command from the root directory:
   ```bash
   npm run dev
   ```
   This single command leverages npm workspaces to concurrently start:
   - The Vite React frontend (`client/`)
   - The Node.js Express/Socket.IO backend (`server/`)

3. **Access the Application**
   - **Frontend**: Check your terminal for the local URL provided by Vite (typically `http://localhost:5173`).
   - **Backend**: The server will run on its default port (typically `http://localhost:3000`). By default, the local frontend is configured to communicate with the local backend automatically.

---

## 2. Online Deployment Configuration

Because the application relies on WebSockets for real-time multiplayer game state, the frontend and backend must be deployed separately to appropriate hosting environments.

### A. Backend Deployment (Server)

The backend maintains in-memory state and requires a persistent connection for WebSockets.
**Recommended Providers**: Render, Railway, or Heroku.
> **Note:** Serverless platforms like Vercel or Netlify Serverless Functions are **not suitable** for the backend because they do not support persistent WebSocket connections.

1. **Create Service**: Create a new Web Service on your chosen provider.
2. **Root Directory**: Set the root directory to `server/`.
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. **Environment Variables**:
   - `CORS_ORIGIN`: Set this to your deployed frontend URL (e.g., `https://my-gamehub.vercel.app`).
   - `PORT`: (Usually provided automatically by the host, but useful to know).

### B. Frontend Deployment (Client)

The frontend is a static React application built with Vite.
**Recommended Providers**: Vercel, Netlify, or Cloudflare Pages.

1. **Create Project**: Create a new Project/Site on your chosen provider.
2. **Root Directory**: Set the root directory to `client/`.
3. **Build Command**: `npm install && npm run build`
4. **Output Directory**: `dist` (This is Vite's default output folder).
5. **Environment Variables**:
   - `VITE_SERVER_URL`: Set this to your deployed backend URL (e.g., `https://my-gamehub-backend.onrender.com`).

### C. Deployment Checklist

To ensure the frontend and backend can communicate securely, follow this order:
- [ ] Deploy the **backend** first (it might fail CORS initially, which is fine).
- [ ] Copy the generated **backend URL**.
- [ ] Deploy the **frontend**, making sure to add the backend URL as the `VITE_SERVER_URL` environment variable.
- [ ] Copy the generated **frontend URL**.
- [ ] Go back to your backend settings and set `CORS_ORIGIN` to the new frontend URL. Restart the backend service if necessary.
