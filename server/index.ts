import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let waitingUser: any = null;

wss.on('connection', (ws) => {
  console.log('Client connected');

  if (waitingUser) {
    // Match found
    const otherUser = waitingUser;
    waitingUser = null;

    const room = { user1: ws, user2: otherUser };

    // Notify both users that a match has been found
    ws.send(JSON.stringify({ type: 'match', data: 'You are matched!' }));
    otherUser.send(JSON.stringify({ type: 'match', data: 'You are matched!' }));

    // Handle messages for this room
    ws.on('message', (message) => {
      otherUser.send(message.toString());
    });

    otherUser.on('message', (message: any) => {
      ws.send(message.toString());
    });

    ws.on('close', () => {
      otherUser.send(JSON.stringify({ type: 'partner-disconnected' }));
    });

    otherUser.on('close', () => {
      ws.send(JSON.stringify({ type: 'partner-disconnected' }));
    });

  } else {
    // No one is waiting, so this user has to wait
    waitingUser = ws;
    ws.send(JSON.stringify({ type: 'waiting' }));
  }

  ws.on('close', () => {
    console.log('Client disconnected');
    if (waitingUser === ws) {
      waitingUser = null;
    }
  });
});

server.listen(8080, () => {
  console.log('Server started on port 8080');
});
