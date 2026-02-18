/**
 * Local Development Server for API
 *
 * Runs the serverless functions locally using Express.
 * This mimics Vercel's serverless function behavior for local development.
 */

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from root .env BEFORE any other imports
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

// Verify env vars are loaded
console.log('Environment check:', {
  SUPABASE_URL: process.env.SUPABASE_URL ? '✓ loaded' : '✗ missing',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ loaded' : '✗ missing',
  HUGGINGFACE_API_TOKEN: process.env.HUGGINGFACE_API_TOKEN ? '✓ loaded' : '✗ missing',
});

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Convert Vercel handler to Express handler
const wrapVercelHandler = (handlerPath: string) => {
  return async (req: express.Request, res: express.Response) => {
    // Dynamically import the handler (after env vars are loaded)
    const { default: handler } = await import(handlerPath);

    // Create Vercel-like request/response objects
    const vercelReq = {
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query,
    };

    const vercelRes = {
      status: (code: number) => {
        res.status(code);
        return vercelRes;
      },
      json: (data: any) => {
        res.json(data);
        return vercelRes;
      },
      setHeader: (name: string, value: string) => {
        res.setHeader(name, value);
        return vercelRes;
      },
    };

    try {
      await handler(vercelReq, vercelRes);
    } catch (error) {
      console.error('Handler error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
      });
    }
  };
};

// Routes - use dynamic imports to ensure env vars are loaded first

// Submissions routes
app.post('/api/submissions/create', wrapVercelHandler('./submissions/create'));
app.get('/api/submissions/history', wrapVercelHandler('./submissions/history'));

// Trends routes (counselor only)
app.get('/api/trends/aggregate', wrapVercelHandler('./trends/aggregate'));

// Counselor approval routes
app.get('/api/counselors/pending', wrapVercelHandler('./counselors/pending'));
app.post('/api/counselors/approve', wrapVercelHandler('./counselors/approve'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 API Dev Server running on http://localhost:${PORT}`);
  console.log(`   POST /api/submissions/create - Submit text for analysis`);
  console.log(`   GET  /api/submissions/history - Get submission history`);
  console.log(`   GET  /api/trends/aggregate - Get aggregate trends (counselors)`);
  console.log(`   GET  /api/counselors/pending - Get pending approvals (counselors)`);
  console.log(`   POST /api/counselors/approve - Approve/reject counselor (counselors)`);
  console.log(`   GET  /api/health - Health check\n`);
});
