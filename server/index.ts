import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// --- CONFIG & STATE ---
interface User {
  ws: WebSocket;
  username: string;
}

const cooldowns = new Map<string, number>();
const partners = new Map<WebSocket, { ws: WebSocket; username: string }>();
let waitingUser: User | null = null;

const COOLDOWN_TIME = 5000; // 5 seconds

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  // 1. RATE LIMITING
  if (cooldowns.has(ip)) {
    const lastActive = cooldowns.get(ip)!;
    if (now - lastActive < COOLDOWN_TIME) {
      console.log(`Rate limit hit for ${ip}`);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Please wait a few seconds before looking for a new match.' 
      }));
      ws.close();
      return;
    }
  }

  cooldowns.set(ip, now);
  console.log(`Client connected: ${ip}`);

  ws.on('message', (data) => {
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch (e) { return; }

    // 2. RELAY LOGIC (Typing & Messages)
    const myPartner = partners.get(ws);
    if (myPartner && myPartner.ws.readyState === WebSocket.OPEN) {
        // This relays everything (text, timestamps, typing status) to the partner
        myPartner.ws.send(data.toString());
        return;
    }

    // 3. MATCHING LOGIC
    if (message.username) {
      if (!waitingUser) {
        waitingUser = { ws, username: message.username };
        ws.send(JSON.stringify({ type: 'waiting' }));
      } else if (waitingUser.ws !== ws) {
        const partner = waitingUser;
        waitingUser = null;

        console.log(`Matching ${message.username} with ${partner.username}`);

        partners.set(ws, { ws: partner.ws, username: partner.username });
        partners.set(partner.ws, { ws: ws, username: message.username });

        ws.send(JSON.stringify({ type: 'match', partnerName: partner.username }));
        partner.ws.send(JSON.stringify({ type: 'match', partnerName: message.username }));
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    
    if (waitingUser?.ws === ws) {
      waitingUser = null;
    }

    const p = partners.get(ws);
    if (p && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(JSON.stringify({ type: 'partner-disconnected' }));
      partners.delete(p.ws);
    }
    partners.delete(ws);
  });
});

server.listen(8080, () => {
  console.log('Server started on port 8080');
});