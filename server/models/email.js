const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema({
  MessageId: { type: String, required: true },
  from: String,
  date: String,
  subject: String,
  body: String,

  // Owner — which user does this email belong to?
  userId: { type: String, default: null, index: true },

  // Hybrid classifier fields
  companyName: { type: String, default: "unknown" },
  appliedFrom: { type: String, default: "unknown" },
  status: { type: String, default: "unknown" },

  extractDate: { type: String, default: null },
  confidence: { type: Number, default: 0 },

  jobRole: { type: String, default: "unknown" }

});

module.exports = mongoose.model("Email", emailSchema);
