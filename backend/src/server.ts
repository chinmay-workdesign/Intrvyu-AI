import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { URL } from "url";

import authRoutes from "./routes/auth.js";
import interviewRoutes from "./routes/interview.js";
import { handleLiveSession } from "./services/liveProxyService.js";

dotenv.config();

console.log("========== Intrvyu AI ==========");
console.log("Loading server...");

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET =
  process.env.JWT_SECRET || "super-secret-key-intrvyu-ai";

// ---------- Global Error Handlers ----------

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception");
  console.error(err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection");
  console.error(reason);
});

// ---------- Middleware ----------

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- Health ----------

app.get("/", (_, res) => {
  res.json({
    status: "running",
    service: "Intrvyu AI Backend",
    timestamp: new Date(),
  });
});

app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

console.log("Registering routes...");

// ---------- Routes ----------

app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);

console.log("Routes registered successfully");

// ---------- HTTP Server ----------

const server = http.createServer(app);

// ---------- WebSocket ----------

const wss = new WebSocketServer({
  noServer: true,
});

server.on("upgrade", (request, socket, head) => {
  try {
    const url = new URL(
      request.url || "",
      `http://${request.headers.host}`
    );

    const match = url.pathname.match(
      /^\/api\/interview\/live\/([A-Za-z0-9-]+)$/
    );

    if (!match) {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
      return;
    }

    const sessionId = match[1];
    const token = url.searchParams.get("token");

    if (!token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, sessionId);
    });
  } catch (err) {
    console.error("WebSocket upgrade failed");
    console.error(err);

    socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
    socket.destroy();
  }
});

wss.on("connection", (ws: any, sessionId: string) => {
  console.log(`WebSocket connected: ${sessionId}`);

  try {
    handleLiveSession(ws, sessionId);
  } catch (err) {
    console.error("Live session failed");
    console.error(err);

    ws.close();
  }
});

// ---------- Start ----------

console.log("Starting HTTP server...");

server.listen(PORT, "0.0.0.0", () => {
  console.log("================================");
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log("================================");
});

// ---------- Graceful Shutdown ----------

process.on("SIGTERM", () => {
  console.log("SIGTERM received");

  server.close(() => {
    console.log("HTTP Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received");

  server.close(() => {
    console.log("HTTP Server closed");
    process.exit(0);
  });
});