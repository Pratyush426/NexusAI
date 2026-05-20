const express = require('express');
const app = express();
const path = require('path');
require("dotenv").config();

const connectDB = require("./config/db");
connectDB();

// ── Middleware ────────────────────────────────────────────────────────────────
app.set("view engine", "ejs");
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(require("cors")({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.static(path.join(__dirname, "public")));

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  const mongoose = require("mongoose");
  const dbState = mongoose.connection.readyState;
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  
  let redisStatus = "unknown";
  try {
    const emailQueue = require("./queue/queue");
    // Check Redis connection state
    const client = await emailQueue.client;
    redisStatus = client ? client.status : "unknown";
  } catch (redisErr) {
    redisStatus = "error: " + redisErr.message;
  }

  res.status(200).json({
    status: "healthy",
    database: {
      state: states[dbState] || "unknown",
      readyState: dbState,
    },
    redis: redisStatus,
    env: {
      hasMongoUri: !!process.env.MONGO_URI,
      hasRedisUrl: !!process.env.REDIS_URL,
      hasRedisHost: !!process.env.REDIS_HOST,
      hasGroqApiKey: !!process.env.GROQ_API_KEY,
    }
  });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/", require("./routes/emailRoutes"));  // handles GET / (Gmail OAuth page) + /api/create + /api/emails

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
