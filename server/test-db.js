require('dotenv').config();
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
});
const User = mongoose.model('User', userSchema);

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nexusai";
console.log("Connecting to:", uri);

mongoose.connect(uri)
    .then(async (conn) => {
        console.log("Connected to DB:", conn.connection.name);
        try {
            const count = await User.countDocuments();
            console.log(`User count in 'User' collection: ${count}`);

            if (count > 0) {
                const users = await User.find().limit(3);
                console.log("Last 3 users:", users);
            }
        } catch (e) {
            console.error("Error finding users:", e);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error("Connection Error:", err);
        process.exit(1);
    });
