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
import { initializeMessageSocket } from "./socket/messageSocket.js";

// Load env variables
dotenv.config();

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
app.use("/api/users", authRoutes);
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
    origin: "*",
  },
});

// 🔥 Initialize Real-Time Messaging
initializeMessageSocket(io);

// Server Port
const PORT = process.env.PORT || 5000;

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});