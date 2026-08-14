require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Start Express server immediately so port 5000 is active right away
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Connect to DB asynchronously in background
  connectDB().then((dbConnected) => {
    if (!dbConnected) {
      console.log('MongoDB is not available right now. Backend running with fallbacks until MongoDB is started.');
    } else {
      const { startDeadlineScheduler } = require('./src/services/reminderScheduler');
      startDeadlineScheduler();
    }
  });
});

