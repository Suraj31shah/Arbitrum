const mongoose = require('mongoose');

async function testConnection() {
  console.log("Attempting standard connection string...");
  try {
    await mongoose.connect('mongodb://drashtisingh14_db_user:VKOeAbVIea19CQWD@ac-b6s8wlo-shard-00-00.nnk5ntz.mongodb.net:27017,ac-b6s8wlo-shard-00-01.nnk5ntz.mongodb.net:27017,ac-b6s8wlo-shard-00-02.nnk5ntz.mongodb.net:27017/commitx?ssl=true&replicaSet=atlas-4847pj-shard-0&authSource=admin&retryWrites=true&w=majority', {
      serverSelectionTimeoutMS: 5000
    });
    console.log("Successfully connected to MongoDB!");
    process.exit(0);
  } catch (error) {
    console.error("Connection failed:", error.message);
    process.exit(1);
  }
}

testConnection();
