const Bull = require("bull");
require("dotenv").config();

const emailQueue = process.env.REDIS_URL
  ? new Bull("email-queue", process.env.REDIS_URL)
  : new Bull("email-queue", {
      redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
      }
    });

module.exports = emailQueue;
