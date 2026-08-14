const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();
// Fix Windows default DNS SRV query refusal for MongoDB Atlas mongodb+srv URIs
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('Could not set custom DNS servers:', dnsErr.message);
}
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error('MONGODB_URI is not defined in environment variables.');
    return false;
  }

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('MongoDB connected successfully');
    
    // Add global error listener to prevent unhandled 'error' events from crashing the process
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error after initial connection:', err.message);
    });
    
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return false;
  }
};

module.exports = connectDB;
