const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/jobtrack");
    console.log("Connected to DB:", conn.connection.name);
  } catch (err) {
    console.error(err);
  }
};

module.exports = connectDB;
