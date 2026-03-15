# PAHIGAL - Real-time Chat Application

**PAHIGAL** is a high-performance, real-time random matchmaking chat
application. Inspired by a reverse-engineering of **"Pahungaw
Tech"**---a defunct matchmaking platform originally based in a Cebu
university---this project modernizes the experience with a sleek
geometric aesthetic and a robust technical architecture.

------------------------------------------------------------------------

## 🎨 Make It Yours (Open for Modification)

**PAHIGAL is built to be a foundation, not just a final product.**
Whether you are a student at a Cebu university or a developer looking to
experiment with WebSockets, you are encouraged to:

-   **Modify the Logic:** Re-engineer the matchmaking algorithm to suit
    your specific community needs.
-   **Redesign the UI:** Use the existing CSS variable system to create
    entirely new themes beyond Dark and Light mode.
-   **Extend Features:** Add your own creative touches, like file
    sharing, voice notes, or custom emoji reactions.

------------------------------------------------------------------------

## 🚀 Features

-   **Anonymous Matchmaking**: Instantly connects two random users
    through a secure, Map-based WebSocket pairing system.
-   **Real-time Communication**: Low-latency messaging built with
    Node.js and the `ws` library.
-   **Modern Geometric UI**: A responsive interface utilizing **Google
    Sans** for displays and **Montserrat** for body text.
-   **Interactive Design**: Springy "return-to-home" logo animations and
    hover growth effects.
-   **Native Dark Mode**: Fully optimized Dark Mode by default, with a
    secondary glassmorphism Light Mode.
-   **Session Guarding**: Integrated "Nuclear" event guards and
    `lastSend` cooldowns to eliminate accidental triggers.

------------------------------------------------------------------------

## 🛠️ Tech Stack

-   **Frontend:** React 18, TypeScript, Vite\
-   **Backend:** Node.js, Express, WebSocket (`ws`)\
-   **Styling:** CSS3 with Glassmorphism and Custom Properties\
-   **Fonts:** Google Sans and Montserrat

------------------------------------------------------------------------

## 📦 Installation & Setup

### 1. Clone and Install

``` bash
git clone <repository-url>
cd pahigal
npm install
```

### 2. Running Locally

#### Start the Backend

``` bash
npm run start:server
```

#### Start the Frontend

``` bash
npm run dev
```

------------------------------------------------------------------------

## 🌐 Public Deployment

### Frontend (Vercel)

-   **Connect:** Link your GitHub repository to Vercel.
-   **Environment Variables:** Set `VITE_WS_URL` to your deployed
    backend URL\
    *(e.g., `wss://your-server.onrender.com`)*.
-   **Build Command:**

``` bash
npm run build
```

-   **Output Directory:** `dist`

------------------------------------------------------------------------

### Backend (Render or Railway)

-   **Service:** Deploy the server as a **Web Service** on
    **Render.com** or **Railway.app**.
-   **Port Configuration:** Ensure the server uses `process.env.PORT` to
    listen on the host's assigned port.
-   **Security:** Always use `wss://` (**Secure WebSocket**) if your
    frontend is served over HTTPS.

------------------------------------------------------------------------

## 🔧 Technical Deep Dive

### Map-Based Pairing

The backend utilizes a **Map** to track active partnerships, ensuring
**O(1)** performance.

### Event Propagation

UI buttons use isolation:

``` css
isolate
```

and

``` javascript
e.stopPropagation()
```

to manage stacking contexts and prevent **event bleeding**.

### State Integrity

The `useEffect` hook is refined to depend strictly on `status` and
`username`, preventing connection resets during active chat state
updates.
