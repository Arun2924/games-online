# GameHub Deployment Guide

This repository contains a fullstack application consisting of a React + Vite frontend (`client`) and a Node.js + Express + Socket.IO backend (`server`). Because it relies on stateful WebSocket connections, you must deploy the frontend and backend separately and ensure the backend supports WebSockets.

## Backend Deployment (Server)

The backend maintains in-memory state for active game rooms.

### Recommended Providers: Render, Railway, or Heroku
Serverless platforms like Vercel or Netlify Serverless Functions are **not suitable** for the backend because they don't support persistent WebSocket connections.

1. Create a new Web Service on your chosen provider.
2. Set the Root Directory to `server/` (or point the build command appropriately).
3. **Build Command**: `npm install && npm run build` (Ensure you compile TypeScript).
4. **Start Command**: `npm start` (Make sure your `package.json` has `"start": "node dist/index.js"`).
5. **Environment Variables**:
   - `CORS_ORIGIN`: Set this to your frontend URL (e.g. `https://my-gamehub.vercel.app`).
   - `PORT`: (Usually provided automatically by the host, but useful to expose if needed).

## Frontend Deployment (Client)

The frontend is a static React application built with Vite.

### Recommended Providers: Vercel, Netlify, or Cloudflare Pages
1. Create a new Project/Site on your chosen provider.
2. Set the Root Directory to `client/`.
3. **Build Command**: `npm install && npm run build`.
4. **Output Directory**: `dist` (This is the default for Vite).
5. **Environment Variables**:
   - `VITE_SERVER_URL`: Set this to your deployed backend URL (e.g. `https://my-gamehub-backend.onrender.com`).

## Handling Disconnects and State
Currently, the room state is kept in-memory. If the backend restarts, all active rooms will be lost. This is acceptable for a mini-game arcade. However, ensure that your hosting provider does not aggressively terminate long-running connections (some free tiers have 24h limits or scale to 0).
