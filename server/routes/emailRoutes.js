const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  showHome,
  createEmail,
  addEmailQueue,
  classifyEmailById,
  getAllEmails
} = require("../controllers/emailController");

// Public — Gmail OAuth landing page
router.get("/", showHome);

// Protected — all email operations require valid JWT
router.post("/api/create", protect, createEmail);
router.get("/api/emails", protect, getAllEmails);
router.post("/api/add-email", protect, addEmailQueue);
router.post("/api/classify/:id", protect, classifyEmailById);

module.exports = router;