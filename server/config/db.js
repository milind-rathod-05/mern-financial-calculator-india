const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

/**
 * Connect to MongoDB with automatic retry logic
 * @param {number} retryCount - Current attempt counter
 */
const connectDB = async (retryCount = 0) => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fincalc-india';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: process.env.NODE_ENV !== 'production'
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    await seedDemoUser();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error (attempt ${retryCount + 1}/${MAX_RETRIES}): ${error.message}`);

    if (retryCount < MAX_RETRIES - 1) {
      console.log(`⏳ Retrying MongoDB connection in ${RETRY_INTERVAL_MS / 1000}s...`);
      setTimeout(() => connectDB(retryCount + 1), RETRY_INTERVAL_MS);
    } else {
      console.error('❌ Max connection retries reached. MongoDB failed to connect.');
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
};

// Connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected successfully.');
});

/**
 * Ensure demo account exists in database
 */
const seedDemoUser = async () => {
  try {
    const User = require('../models/User');
    const existing = await User.findOne({ email: 'demo@fincalc.in' });
    if (!existing) {
      await User.create({
        name: 'Demo Investor',
        email: 'demo@fincalc.in',
        password: 'Password123!',
        preferences: {
          theme: 'light',
          favorites: ['sip', 'advanced-sip', 'emi', 'ppf']
        }
      });
      console.log('🌱 Demo account (demo@fincalc.in / Password123!) seeded.');
    }
  } catch (err) {
    console.error('Demo user seed warning:', err.message);
  }
};

module.exports = connectDB;
