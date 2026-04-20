const fs = require("fs");
const Email = require("../models/email");
const emailQueue = require("../queue/queue");

// GET / — Render Gmail OAuth page (home/index)
exports.showHome = (req, res) => {
  res.render("index", {
    CLIENT_ID: process.env.CLIENT_ID,
    API_KEY: process.env.API_KEY
  });
};

// POST /api/create — Save raw email + queue for AI classification
// Protected: requires JWT (userId comes from req.user set by middleware)
exports.createEmail = async (req, res) => {
  try {
    const { MessageId, from, date, subject, body } = req.body;

    // Get userId from JWT token (set by protect middleware)
    const userId = req.user?.id || null;

    // 1. Store raw email with the user's ID
    const email = await Email.create({
      MessageId,
      from,
      date,
      subject,
      body,
      userId,  // <- owner of this email
    });

    // 2. Queue for background AI classification (non-fatal — save succeeds even if Redis is down)
    try {
      await emailQueue.add({
        emailId: email._id,
        emailData: { body, subject, from }
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true
      });
      console.log(`[Email] Saved & queued for user ${userId}: ${email._id}`);
    } catch (queueErr) {
      console.warn(`[Email] Saved but failed to queue (Redis issue?): ${queueErr.message}`);
    }

    res.status(200).json({ success: true, email });

  } catch (err) {
    console.error('createEmail error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/emails — Get all classified emails for the logged-in user only
// Protected: requires JWT
exports.getAllEmails = async (req, res) => {
  try {
    const userId = req.user.id;

    const emails = await Email.find({
      userId,                              // ← user isolation: only this user's emails
      status: { $not: /^spam$/i },         // hide spam
      companyName: { $not: /^unknown$/i }, // hide unclassified (AI still processing)
    }).sort({ _id: -1 });

    res.status(200).json({ success: true, count: emails.length, data: emails });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/add-email — Simple manual queue add (dev use)
exports.addEmailQueue = async (req, res) => {
  const { emailText } = req.body;
  await emailQueue.add({ emailText });
  res.json({ message: "Email added to queue" });
};

// POST /api/classify/:id — Manually trigger classification for an email
exports.classifyEmailById = async (req, res) => {
  try {
    const { hybridClassifier } = require("../services/classifier/hybridClassifier");
    const email = await Email.findById(req.params.id);
    if (!email) return res.status(404).json({ message: "Email not found" });

    const result = await hybridClassifier({
      subject: email.subject,
      body: email.body,
      from: email.from
    });

    email.companyName = result.companyName;
    email.appliedFrom = result.appliedFrom;
    email.status = result.status;
    email.extractDate = result.date;
    email.confidence = result.confidence;

    await email.save();
    res.json({ success: true, email });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
