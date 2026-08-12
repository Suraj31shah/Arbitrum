require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function testTodoist() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ todoistAccessToken: { $exists: true, $ne: null } });
  
  if (!user) {
    console.log("No user with Todoist token found.");
    process.exit(0);
  }
  
  console.log("Found user:", user.username);
  const token = user.todoistAccessToken;
  
  const endpoints = [
    { url: 'https://api.todoist.com/rest/v2/tasks', method: 'GET' },
    { url: 'https://api.todoist.com/api/v1/tasks', method: 'GET' },
    { url: 'https://api.todoist.com/api/v1/sync', method: 'POST', body: { sync_token: '*', resource_types: ['items'] } },
    { url: 'https://api.todoist.com/sync/v9/sync', method: 'POST', body: { sync_token: '*', resource_types: ['items'] } },
  ];
  
  for (const ep of endpoints) {
    console.log(`\nTesting ${ep.method} ${ep.url}...`);
    const options = {
      method: ep.method,
      headers: { 'Authorization': `Bearer ${token}` }
    };
    if (ep.method === 'POST') {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(ep.body);
    }
    try {
      const res = await fetch(ep.url, options);
      console.log(`Status: ${res.status} ${res.statusText}`);
      if (res.ok) {
        console.log("Success! Data preview:", JSON.stringify(await res.json()).substring(0, 100));
      } else {
        console.log("Error body:", await res.text());
      }
    } catch (e) {
      console.log("Exception:", e.message);
    }
  }
  process.exit(0);
}

testTodoist();
