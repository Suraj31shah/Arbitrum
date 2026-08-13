require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Challenge = require('./src/models/Challenge');

async function fixUser() {
  await mongoose.connect('mongodb://drashtisingh14_db_user:VKOeAbVIea19CQWD@ac-b6s8wlo-shard-00-00.nnk5ntz.mongodb.net:27017,ac-b6s8wlo-shard-00-01.nnk5ntz.mongodb.net:27017,ac-b6s8wlo-shard-00-02.nnk5ntz.mongodb.net:27017/commitx?ssl=true&replicaSet=atlas-4847pj-shard-0&authSource=admin&retryWrites=true&w=majority');
  console.log("Connected to MongoDB.");
  
  // Find the user with the charity wallet
  const user = await User.findOne({ walletAddress: '0x0302cdef4ab13ec1b17110110d1a4592b8866b72' });
  if (user) {
    user.githubUsername = 'Suraj31shah'; // Assuming their GitHub is Suraj31shah based on repo
    user.username = 'Suraj31shah';
    await user.save();
    console.log("Fixed user:", user);
    
    // Fix existing challenges
    await Challenge.updateMany(
      { integrationHandle: { $regex: /^0x0302/i } },
      { $set: { integrationHandle: 'Suraj31shah' } }
    );
    console.log("Fixed challenges.");
  }
  
  process.exit(0);
}

fixUser();
