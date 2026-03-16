# PAHIGAL - Real-time Chat Application 🍑

**PAHIGAL** is a high-performance, real-time random matchmaking chat
application. Inspired by a reverse-engineering of "Pahungaw Tech"---a
defunct matchmaking platform originally based in a Cebu
university---this project modernizes the experience with a sleek
geometric aesthetic, dynamic visual design, and a robust technical
architecture.

------------------------------------------------------------------------

## 🎨 Make It Yours (Open for Modification)

PAHIGAL is built to be a foundation, not just a final product. Whether
you are a student developer in Cebu or someone looking to experiment
with WebSockets, you are encouraged to fork and modify this project:

-   **Modify the Logic:** Re-engineer the matchmaking algorithm to suit
    your specific community needs.
-   **Redesign the UI:** Use the existing CSS variable system to create
    entirely new themes beyond Dark and Light mode.
-   **Extend Features:** Add your own creative touches, like file
    sharing, voice notes, or custom emoji reactions.

------------------------------------------------------------------------

## 🚀 Key Features

### Anonymous Matchmaking

Instantly connects two random users through a secure, Map-based
WebSocket pairing system.

### Real-time Communication

Low-latency messaging built with **Node.js** and the **ws** library.

### Dynamic Jewel-Tone UI

Features a custom React hook that mathematically randomizes deep,
vibrant gradient palettes and subtle CSS overlay patterns (like
blueprint grids or CRT scanlines) on every load for a fresh aesthetic.

### Modern Typography & Glassmorphism

A responsive interface utilizing **Google Sans** for displays,
**Montserrat** for body text, and semi-transparent glassmorphism layers.

### Native Dark/Light Mode

Fully optimized for eye comfort with rich, low-light emission colors by
default.

### Session Guarding

Integrated event guards, lock references (`isConnecting`), and cooldowns
to eliminate accidental triggers, state-looping, or UI spamming.

------------------------------------------------------------------------

## 🛠️ Tech Stack (Monorepo)

**Frontend** - React 19 - TypeScript - Vite

**Backend** - Node.js - Express - WebSocket (`ws`) - `tsx` compiler

**Styling** - Native CSS3 - CSS Custom Properties (Variables)

**Deployment** - Vercel (Frontend) - Render (Backend)

------------------------------------------------------------------------

## 📦 Installation & Local Setup

### 1. Clone and Install

``` bash
git clone https://github.com/hervuwu/PAHIGAL.git
cd PAHIGAL
npm install
```

### 2. Running Locally

Because this is a monorepo, you will need **two terminal windows open.**

#### Terminal 1: Start the Backend Server

``` bash
npm run start:server
```

The server will listen on:

    ws://localhost:8080

#### Terminal 2: Start the Frontend UI

``` bash
npm run dev
```

------------------------------------------------------------------------

## 🌐 Public Deployment Guide

This project is configured to be deployed as **two separate services**
from a single GitHub repository.

### 1. Backend (Render)

**Service:** Deploy the repository as a **Web Service** on Render.

**Build Command**

``` bash
npm install
```

**Start Command**

``` bash
npm run start
```

This triggers:

    tsx server/index.ts

**Note:** Render handles `process.env.PORT` automatically.

After deployment, copy your live URL:

    pahigal-backshot.onrender.com

------------------------------------------------------------------------

### 2. Frontend (Vercel)

**Service:** Import the repository into **Vercel**.

#### Environment Variables (CRITICAL)

Before building, you must add your Render backend URL so **Vite can bake
it into the production code.**

  Key             Value
  --------------- --------------------------------------
  `VITE_WS_URL`   `wss://your-render-url.onrender.com`

⚠️ **Important:** Ensure you use **`wss://`** for secure WebSockets.

#### Build Configuration

**Build Command**

``` bash
npm run build
```

**Output Directory**

    dist
 
------------------------------------------------------------------------

## ⚠️ Deployment Trap

If your **Vercel site hangs on "Waking up Server..." on mobile**, it
means **Vite did not detect the `VITE_WS_URL` during the build** and
fell back to `localhost`.

To fix this:

1.  Add the environment variable in **Vercel Project Settings**
2.  Trigger a **manual redeploy**
3.  The correct WebSocket URL will be baked into the production build

------------------------------------------------------------------------

## 🔧 Technical Deep Dive

### O(1) Map-Based Pairing

The backend utilizes a **JavaScript `Map`** to track active
partnerships.

Instead of iterating through arrays of users to find matches or
disconnections, the server accesses pairing data instantly via unique
socket IDs, ensuring **O(1) time complexity** even under heavy load.

------------------------------------------------------------------------

### React State Integrity & Race Conditions

The frontend utilizes **`useRef` hooks (`statusRef` and
`isConnecting`)** to manage WebSocket connection lifecycles.

This bypasses React's asynchronous state batching, instantly blocking
duplicate connection attempts and preventing **infinite auto-reconnect
loops** when a user intentionally drops a chat.

------------------------------------------------------------------------

### Event Propagation Isolation

UI buttons use **CSS `isolate`** and JavaScript
**`e.stopPropagation()`** to strictly manage stacking contexts and
prevent **event bleeding across the DOM.**

------------------------------------------------------------------------
