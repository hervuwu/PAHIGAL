# Deployment Guide

### Backend (Render/Railway)
* Deploy as a **Web Service**.
* Ensure the server uses `process.env.PORT`.

### Frontend (Vercel)
* Set `VITE_WS_URL` to your deployed backend (e.g., `wss://your-server.com`).
* Build: `npm run build`, Output: `dist`.