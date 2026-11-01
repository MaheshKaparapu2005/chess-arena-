import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import gameRoutes from './routes/gameRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';
import statsRoutes from './routes/statsRoutes';
import analysisRoutes from './routes/analysisRoutes';
import { initializeDatabase } from './config/db';
import { setupChessSockets } from './sockets/chessSocket';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 3000;

// Setup Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());

// Initialize Database (MongoDB with automatic persistent fallback)
initializeDatabase();

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', statsRoutes);
app.use('/api/analysis', analysisRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  const distHtmlExists = fs.existsSync(path.resolve(distPath, 'index.html'));
  const isDevMode = (process.env.NODE_ENV === 'development' || process.env.npm_lifecycle_event === 'dev') && !distHtmlExists;

  if (!isDevMode && distHtmlExists) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('[Chess Arena] Vite middleware unavailable, checking dist fallback...', viteErr);
      if (distHtmlExists) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(path.resolve(distPath, 'index.html'));
        });
      }
    }
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Chess Arena] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Chess Arena] Failed to start server:', err);
});

export { app, httpServer };
