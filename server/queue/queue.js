const Bull = require("bull");
require("dotenv").config();

const emailQueue = process.env.REDIS_URL
  ? new Bull("email-queue", process.env.REDIS_URL, {
      redis: {
        enableOfflineQueue: false
      }
    })
  : new Bull("email-queue", {
      redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD,
        enableOfflineQueue: false
      }
    });

module.exports = emailQueue;
