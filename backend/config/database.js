const mongoose = require('mongoose');
const logger = require('../utils/logger');

let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    const error = new Error('MongoDB connection error: no URI found in MONGODB_URI or MONGO_URI');
    logger.error(error.message);
    throw error;
  }

  try {
    mongoose.set('strictQuery', true);
    mongoose.set('bufferCommands', false);

    connectionPromise = mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
    }).then(() => {
      logger.info('Connected to MongoDB');
      return mongoose.connection;
    });

    return await connectionPromise;
  } catch (err) {
    connectionPromise = null;
    logger.error('MongoDB connection error:', err.message);

    if (err?.name === 'MongoServerSelectionError' || err?.name === 'MongooseServerSelectionError' || err?.message?.includes('secureConnect')) {
      logger.error('MongoDB Atlas/network check failed. Common causes:');
      logger.error('1) The current public IP is not whitelisted in Atlas Network Access.');
      logger.error('2) Your machine is behind a firewall/VPN/proxy blocking outbound MongoDB traffic.');
      logger.error('3) The URI username/password or cluster hostname is incorrect.');
      logger.error('Fix: add your current IP in Atlas > Network Access, verify the Mongo connection string, and ensure outbound access to port 27017/443 is allowed.');
    }

    throw err;
  }
};

module.exports = connectDB;
