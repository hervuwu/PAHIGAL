# PAHIGAL - Real-Time Chat Application

**PAHIGAL** is a high-performance, real-time random matchmaking chat application. Inspired by the architecture of localized university matchmaking platforms, this project modernizes the anonymous chat experience with a scalable WebSockets backend, a responsive React frontend, and a highly extensible design system.

---

## 🚀 Key Features

**Anonymous Matchmaking**
Instant, secure connections utilizing a low-latency WebSocket pairing system.

**Real-Time Communication**
Bi-directional event handling powered by Node.js and the `ws` library.

**Dynamic Theming Engine**
A custom React hook that procedurally generates unique gradient palettes and subtle overlay patterns (e.g., grids, CRT scanlines) on every session load.

**Modern Interface**
A responsive, accessible UI leveraging CSS glassmorphism, Google Sans for display elements, and Montserrat for body typography.

**Robust Session Management**
Integrated event guards, lock references, and cooldown mechanisms to eliminate accidental triggers, state-looping, and UI spamming.

---

## 🧠 Architecture & Technical Highlights

### O(1) Map-Based Pairing

The backend leverages JavaScript `Map` objects to track active partnerships. Instead of iterating through arrays of users to resolve matches or handle disconnections, the server accesses pairing data instantly via unique socket IDs, ensuring **O(1)** time complexity even under heavy concurrent load.

### React State Integrity & Race Conditions

The frontend utilizes `useRef` hooks (`statusRef` and `isConnecting`) to manage WebSocket connection lifecycles synchronously. This bypasses React's asynchronous state batching, instantly blocking duplicate connection attempts and preventing infinite auto-reconnect loops when a user intentionally terminates a session.

### Event Propagation Isolation

UI components utilize CSS `isolate` and JavaScript `e.stopPropagation()` to strictly manage stacking contexts and prevent event bleeding across the DOM during rapid user interactions.

---

## 🛠️ Tech Stack

This project is structured as a monorepo containing both the client and server applications.

### Frontend

* React 19
* TypeScript
* Vite
* Native CSS3 & CSS Custom Properties

### Backend

* Node.js
* Express
* WebSocket (`ws`)
* tsx compiler

### Infrastructure

* Vercel (Frontend Hosting)
* Render (Backend Hosting)

---

## 📦 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/hervuwu/PAHIGAL.git
cd PAHIGAL
npm install
```

### 2. Run the Application

Because this is a monorepo, you must run the client and server concurrently in separate terminal instances.

**Terminal 1: Start the Backend Server**

```bash
npm run start:server
```

The server will initialize and listen on:

```
ws://localhost:8080
```

**Terminal 2: Start the Frontend UI**

```bash
npm run dev
```

The Vite development server will start and provide a local localhost URL.

---

## 🌐 Deployment Guide

This repository is configured to be deployed as two separate services.

### 1. Backend (Render)

Deploy the repository as a **Web Service** on Render.

**Build Command**

```bash
npm install
```

**Start Command**

```bash
npm run start
```

(This triggers `tsx server/index.ts`)

**Note:** Render automatically handles port binding via `process.env.PORT`.

---

### 2. Frontend (Vercel)

Import the repository into Vercel.

#### Environment Variables Configuration

Before initializing the build, you must provide your Render backend URL so Vite can inject it into the production bundle.

| Key         | Value                               |
| ----------- | ----------------------------------- |
| VITE_WS_URL | wss://pahigal-backshot.onrender.com |

Ensure you use the secure **wss://** protocol.

**Build Command**

```bash
npm run build
```

**Output Directory**

```
dist
```

---

## ⚠️ Troubleshooting

**Issue:** The deployed application hangs on "Waking up Server..." on mobile devices.

**Cause:**
Vite failed to detect the `VITE_WS_URL` environment variable during the build process and has fallen back to standard localhost.

**Resolution:**

1. Navigate to your Vercel Project Settings → Environment Variables.
2. Ensure `VITE_WS_URL` is correctly set for the Production environment.
3. Trigger a manual redeployment to bake the variable into the new build.

---

## 🤝 Extensibility & Customization

PAHIGAL is designed as an unopinionated foundation. Developers are encouraged to fork and extend the architecture:

* **Algorithm Modification:** Re-engineer the backend matchmaking logic to support localized routing or specific community parameters.
* **UI Overhauls:** Utilize the existing CSS variable system to implement entirely new visual themes beyond standard Light/Dark modes.
* **Feature Expansion:** Integrate media sharing, voice notes, or custom WebSocket payloads (e.g., typing indicators, message reactions).

---

## 📄 License

This project is open-source and available for modification and distribution.
