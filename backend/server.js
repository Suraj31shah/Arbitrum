const app = require('./src/app');
const connectDB = require('./src/config/database');

// Start the Express server on port 5000
const PORT = 5000;

const startServer = async () => {
  const dbConnected = await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!dbConnected) {
      console.log('MongoDB is not available right now. The server is running, but database-backed routes will fail until MongoDB is started.');
    }
  });
};

startServer();
