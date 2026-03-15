import '@testing-library/jest-dom';
import { WebSocket } from 'mock-socket';

(global as any).WebSocket = WebSocket;
