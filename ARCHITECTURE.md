# Project Architecture



PAHIGAL uses a decoupled architecture separating the React UI from the Node.js matchmaking engine.

### Pairing Logic
The server uses a **Relay Node** approach with a `Map` to track active partnerships, ensuring **O(1) performance** by passing messages directly between paired WebSockets.

### UI State Management
The app flow is controlled by a central `status` state (`UNSET` -> `WAITING` -> `CHATTING` -> `DISCONNECTED`). A `lastSend` Ref prevents accidental triggers during rapid messaging.