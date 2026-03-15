import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

interface User {
  ws: WebSocket;
  username: string;
}

let waitingUser: User | null = null;
// Use a Map to track active chat pairs
const partners = new Map<WebSocket, { ws: WebSocket; username: string }>();

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data) => {
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch (e) { 
      return; 
    }

    // 1. RELAY LOGIC: If this user already has a partner, relay the message and STOP.
    const myPartner = partners.get(ws);
    if (myPartner && myPartner.ws.readyState === WebSocket.OPEN) {
      myPartner.ws.send(data.toString());
      return; // This return prevents the matching logic below from firing during a chat.
    }

    // 2. MATCHING LOGIC: Only runs if the user is not in a chat.
    if (message.username) {
      if (!waitingUser) {
        // First user arrives, put them in the waiting room.
        waitingUser = { ws, username: message.username };
        ws.send(JSON.stringify({ type: 'waiting' }));
        console.log(`${message.username} is waiting...`);
      } else if (waitingUser.ws !== ws) {
        // Second user arrives, pair them with the waiting user.
        const partner = waitingUser;
        waitingUser = null;

        console.log(`Matching ${message.username} with ${partner.username}`);

        // Establish the link in BOTH directions in the Map.
        partners.set(ws, { ws: partner.ws, username: partner.username });
        partners.set(partner.ws, { ws: ws, username: message.username });

        // Notify both clients of the match.
        ws.send(JSON.stringify({ type: 'match', partnerName: partner.username }));
        partner.ws.send(JSON.stringify({ type: 'match', partnerName: message.username }));
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    
    // Clean up if the user was the one waiting.
    if (waitingUser?.ws === ws) {
      waitingUser = null;
    }

    // If the user was in a chat, notify their partner.
    const p = partners.get(ws);
    if (p && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(JSON.stringify({ type: 'partner-disconnected' }));
      // Remove the partner's link to the disconnected user.
      partners.delete(p.ws);
    }
    
    // Remove the disconnected user from the Map.
    partners.delete(ws);
  });
});

server.listen(8080, () => {
  console.log('Server started on port 8080');
});