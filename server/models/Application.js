const mongoose = require('mongoose');

/**
 * Manual Application — created by user from the dashboard form.
 * Separate from email-synced applications for clarity.
 */
const applicationSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    job_title: { type: String, required: true },
    company_name: { type: String, required: true },
    status: {
        type: String,
        enum: ['applied', 'shortlisted', 'interview', 'selected', 'rejected'],
        default: 'applied'
    },
    applied_via: { type: String, default: 'Manual' },
    applied_date: { type: String, default: () => new Date().toISOString() },
    notes: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
