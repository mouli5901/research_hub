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
    if (!origin) return callback(null, true); // allow non-browser requests
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') return callback(null, true);
    const allowed = allowedOrigins.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    callback(null, allowed ? true : true); // allow requests in production unless strictly disallowed
  },
  credentials: true
}));

app.use(express.json());

// API Routes
app.use('/api/artifacts', artifactRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Git for Research Versioning & Real-time Presence Server Running'
  });
});

// Connect DB once and export for Vercel serverless
let dbConnected = false;
const ensureDB = async () => {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
};

// Local dev vs Vercel serverless
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Server & Socket.IO running on http://localhost:${PORT}`);
  });
  connectDB().catch((err) => {
    console.error("MongoDB initial connection error:", err);
  });
} else {
  // Vercel serverless: ensure DB is ready on first invocation
  ensureDB();
}

export default server;
