const mongoose = require('mongoose');

async function testConnection() {
  console.log("Attempting to connect to MongoDB...");
  try {
    await mongoose.connect('mongodb+srv://drashtisingh14_db_user:VKOeAbVIea19CQWD@cluster0.nnk5ntz.mongodb.net/commitx?retryWrites=true&w=majority', {
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    console.log("Successfully connected to MongoDB!");
    process.exit(0);
  } catch (error) {
    console.error("Connection failed:", error.message);
    process.exit(1);
  }
}

testConnection();
