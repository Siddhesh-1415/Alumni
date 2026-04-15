import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import csvRoutes from "./routes/csvRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import { initializeMessageSocket } from "./socket/messageSocket.js"
import chatbotRoutes from "./routes/chatbotRoutes.js";

// Load env variables
dotenv.config({"path":"C:\\Users\\tambe\\OneDrive\\Desktop\\BC\\Alumni\\backend\\.env"});

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/csv", csvRoutes);
app.use("/api/public", publicRoutes)
app.use("/api/users", authRoutes)
app.use("/api/chatbot", chatbotRoutes)
// Test Route
app.get("/", (req, res) => {
  res.send("Alumni Portal API Running");
});

// Error Middleware
app.use(errorHandler);

// 🔥 Create HTTP Server
const server = http.createServer(app);

// 🔥 Socket Server
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 60000,
  pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 25000,
});

// 🔥 Make io available to controllers
app.set('io', io);

// 🔥 Initialize Real-Time Messaging
initializeMessageSocket(io);

// Server Port
const PORT = process.env.PORT || 5000;

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});