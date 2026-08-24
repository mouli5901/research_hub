import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import artifactRoutes from './routes/artifactRoutes.js';
import { setupSocketIO } from './services/socketService.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Allowed origins: localhost dev + common deployment platforms + CLIENT_URL env
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  /\.vercel\.app$/,
  /\.netlify\.app$/,
  /\.onrender\.com$/,
  /\.railway\.app$/,
  process.env.CLIENT_URL,
].filter(Boolean);

// Initialize Socket.IO
const io = setupSocketIO(server, allowedOrigins);
app.set('io', io);

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Database connection middleware for all API requests
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB Connection Middleware Error:", err.message);
    res.status(500).json({ 
      error: `Database connection failed: ${err.message}. Please verify MONGODB_URI in your Vercel project environment variables and ensure MongoDB Atlas Network Access is set to 0.0.0.0/0 (Allow access from anywhere).` 
    });
  }
});

// API Routes
app.use('/api/artifacts', artifactRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Git for Research Versioning & Real-time Presence Server Running'
  });
});

// Local dev server listener
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Server & Socket.IO running on http://localhost:${PORT}`);
  });
}

export default server;
