const mongoose = require('mongoose');

/**
 * Establishes a connection to MongoDB using Mongoose.
 * Reads the connection URI from the MONGO_URI environment variable.
 * Exits the process on a fatal connection failure so the container/process
 * manager can restart the service.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 7+ no longer requires these flags, but they are kept here
      // as explicit documentation of the intent.
      // useNewUrlParser: true,      // deprecated – safe to omit in Mongoose 7
      // useUnifiedTopology: true,   // deprecated – safe to omit in Mongoose 7
    });

    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌  MongoDB connection error: ${error.message}`);
    // Exit with failure code so PM2 / Docker can restart the service
    process.exit(1);
  }
};

// Graceful shutdown – close the Mongoose connection when the Node process ends
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌  MongoDB connection closed (app termination).');
  process.exit(0);
});

module.exports = connectDB;
