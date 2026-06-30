import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { URL } from 'url';

import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interview.js';
import { handleLiveSession } from './services/liveProxyService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT && process.env.PORT !== '5432' ? parseInt(process.env.PORT) : 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-intrvyu-ai';

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP headers if needed for REST testing
}));
app.use(cors({
  origin: '*', // Allow all in dev, modify for prod
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Create HTTP Server
const server = http.createServer(app);

// Create WebSocket Server
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket Upgrade
server.on('upgrade', (request, socket, head) => {
  try {
    const requestUrl = new URL(request.url || '', `http://${request.headers.host}`);
    const pathname = requestUrl.pathname;

    // Match path: /api/interview/live/:sessionId
    const match = pathname.match(/^\/api\/interview\/live\/([a-zA-Z0-9-]+)$/);

    if (match) {
      const sessionId = match[1];
      const token = requestUrl.searchParams.get('token');

      if (!token) {
        console.warn('[WS Upgrade] Rejected: Missing JWT token.');
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // Verify JWT
      try {
        jwt.verify(token, JWT_SECRET);
      } catch (err) {
        console.warn('[WS Upgrade] Rejected: Invalid JWT token.');
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, sessionId);
      });
    } else {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
    }
  } catch (error) {
    console.error('[WS Upgrade] Error:', error);
    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    socket.destroy();
  }
});

// Handle WebSocket connections
wss.on('connection', (ws: any, sessionId: string) => {
  handleLiveSession(ws, sessionId);
});

// Start Server
server.listen(PORT, () => {
  console.log(`[Server] Intrvyu AI backend is running on port ${PORT}`);
});
