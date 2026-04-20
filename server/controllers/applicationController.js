const Application = require('../models/Application');
const Email = require('../models/email');

// GET /api/emails — User's Gmail-synced emails (classified)
// Already handled in emailController.js — this controller handles MANUAL apps

// POST /api/applications — Create manual application
exports.createApplication = async (req, res) => {
    try {
        const userId = req.user.id;
        const { job_title, company_name, status, applied_via, applied_date, notes } = req.body;

        if (!job_title || !company_name) {
            return res.status(400).json({ message: 'Job title and company name are required.' });
        }

        const app = await Application.create({
            userId,
            job_title,
            company_name,
            status: status || 'applied',
            applied_via: applied_via || 'Manual',
            applied_date: applied_date || new Date().toISOString(),
            notes: notes || null,
        });

        res.status(201).json({ success: true, data: app });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/applications — Get all manual apps for the user
exports.getApplications = async (req, res) => {
    try {
        const userId = req.user.id;
        const apps = await Application.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: apps.length, data: apps });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// PUT /api/applications/:id — Update an application
exports.updateApplication = async (req, res) => {
    try {
        const userId = req.user.id;
        const app = await Application.findOne({ _id: req.params.id, userId });
        if (!app) return res.status(404).json({ message: 'Application not found.' });

        Object.assign(app, req.body);
        await app.save();
        res.json({ success: true, data: app });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// DELETE /api/applications/:id — Delete an application (manual OR email-synced)
exports.deleteApplication = async (req, res) => {
    try {
        const userId = req.user.id;

        // Try manual Application first
        const manualApp = await Application.findOneAndDelete({ _id: req.params.id, userId });
        if (manualApp) return res.json({ success: true });

        // If not found, try email-synced Email document
        const emailApp = await Email.findOneAndDelete({ _id: req.params.id, userId });
        if (emailApp) return res.json({ success: true });

        res.status(404).json({ message: 'Application not found or unauthorized.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
