import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import handler from './gemini'; // the typescript module

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/gemini', async (req, res) => {
    // Vercel and Express req/res are compatible enough for this basic usage
    await handler(req as any, res as any);
});

app.listen(3001, () => {
    console.log('Local API server running on port 3001');
});
