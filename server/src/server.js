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

// Initialize Socket.IO
const io = setupSocketIO(server);
app.set('io', io);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
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

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server & Socket.IO running on http://localhost:${PORT}`);
  });
};

startServer();
