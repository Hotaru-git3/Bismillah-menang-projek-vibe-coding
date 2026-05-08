import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

// Vercel API backend simulation
// If it was in Vercel, this would be in api/gemini.ts,
// but for run.app, we need the Express server to handle it.
import geminiHandler from './api/gemini.ts'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("HEALTH CHECK PRE-VITE GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 7) : "EMPTY");
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Request mapping for the Vercel-like handler
  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", keyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0 });
  });

  app.post('/api/gemini', async (req, res) => {
    await geminiHandler(req as any, res as any);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
