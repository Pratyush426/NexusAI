const mongoose = require("mongoose");
const emailQueue = require("../queue/queue");
const Email = require("../models/email");
const { extractBasicFields } = require("../services/classifier/fieldExtractor");
const { classifyStatusNLP } = require("../services/classifier/nlpClassifier");
const connectDB = require("../config/db");
require("dotenv").config();

// Connect to DB for the worker process and wait
connectDB().then(() => {
  console.log("Worker process started via Bull...");

  emailQueue.process(async (job) => {
    console.log(`[Job ${job.id}] Processing email: ${job.data.emailData?.subject}`);
    const { emailId, emailData } = job.data;

    if (!emailId) {
        console.error("Missing emailId in job");
        return Promise.reject(new Error("Missing emailId"));
    }

    try {
        // 1. Unified Extraction (Fields + Status)
        // Now returns: { companyName, jobRole, appliedFrom, status, confidence, ... }
        const extraction = await extractBasicFields(emailData);

        let status = extraction.status;
        let confidence = extraction.confidence;

        // 2. Status Fallback (if Groq returned "other" or "unknown" and regex was weak)
        if (!status || status === "unknown" || status === "other") {
            const statusResult = classifyStatusNLP(emailData);
            status = statusResult.label;
            if (statusResult.confidence > confidence) {
                confidence = statusResult.confidence;
            }
        }

        // 3. Update DB
        const updateData = {
            companyName: extraction.companyName,
            appliedFrom: extraction.appliedFrom,
            jobRole: extraction.jobRole,
            status: status || "applied",
            confidence: confidence
        };

        await Email.findByIdAndUpdate(emailId, updateData);

        console.log(`[Job ${job.id}] Completed. Extracted: ${JSON.stringify(updateData)}`);
        return Promise.resolve(updateData);

    } catch (err) {
        console.error(`[Job ${job.id}] Failed:`, err);
        return Promise.reject(err);
    }
});

// Handle errors
emailQueue.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed with error ${err.message}`);
});
}); // <--- added to close connectDB().then(() => {
