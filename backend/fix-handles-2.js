const mongoose = require('mongoose');
const Challenge = require('./src/models/Challenge');
const User = require('./src/models/User');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const challenges = await Challenge.find({ integrationId: { $ne: 'none' } });
  
  for (const challenge of challenges) {
    let modified = false;
    for (const participant of challenge.participants) {
      if (participant.integrationHandle && participant.integrationHandle.startsWith('0x')) {
        const user = await User.findById(participant.user);
        if (user && user.githubUsername) {
          participant.integrationHandle = user.githubUsername;
          modified = true;
          console.log(`Updated handle for ${user.username} to ${user.githubUsername}`);
        } else {
          // If they don't have a github username yet, clear it so they are forced to reconnect/update
          participant.integrationHandle = '';
          modified = true;
          console.log(`Cleared invalid handle for ${user ? user.username : participant.user}`);
        }
      }
    }
    if (modified) {
      await challenge.save();
    }
  }

  console.log('Done');
  process.exit(0);
}

run().catch(console.error);
