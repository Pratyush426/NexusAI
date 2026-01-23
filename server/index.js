const express = require('express');
const app = express();
const path = require('path');
require("dotenv").config();


const connectDB = require("./config/db");
connectDB();

//Middleware
app.set("view engine", "ejs");
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(require("cors")());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api", require("./routes/emailRoutes"));


//Routes
const emailRoutes = require("./routes/emailRoutes");
const authRoutes = require("./routes/authRoutes");
app.use("/", emailRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", require("./routes/userRoutes"));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
