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
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/", require("./routes/emailRoutes"));  // handles GET / (Gmail OAuth page) + /api/create + /api/emails

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
