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
      if (!participant.integrationHandle) {
        const user = await User.findById(participant.user);
        if (user) {
          let handle = '';
          if (challenge.integrationId === 'github') handle = user.githubUsername || user.username;
          else if (challenge.integrationId === 'notion') handle = user.notionId;
          else if (challenge.integrationId === 'google') handle = user.googleId;
          
          if (handle) {
            participant.integrationHandle = handle;
            modified = true;
            console.log(`Backfilled handle ${handle} for user ${user.username} in challenge ${challenge._id}`);
          }
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
