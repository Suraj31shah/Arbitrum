require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function disconnectTodoist() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");
  
  const result = await User.updateMany(
    { todoistAccessToken: { $exists: true } },
    { $unset: { todoistId: "", todoistAccessToken: "" } }
  );
  
  console.log(`Disconnected Todoist for ${result.modifiedCount} user(s).`);
  process.exit(0);
}


disconnectTodoist();
