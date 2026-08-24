import mongoose from 'mongoose';
import dns from 'dns';

// Only set custom DNS servers on local Windows machines to avoid issues on Vercel/Linux
if (process.platform === 'win32' && !process.env.VERCEL) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch (e) {
    // Ignore fallback error
  }
}

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not defined.');
    throw new Error('MONGODB_URI environment variable is missing. Please add MONGODB_URI to your Vercel Environment Variables.');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000 // Fast fail timeout (8 seconds)
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;
