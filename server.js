/**
 * Local dev server — runs without Vercel CLI
 * Usage: node server.js
 */

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { analyzeWebsite } from './lib/agent.js';

// Load .env manually
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envFile = readFileSync(join(__dirname, '.env'), 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.slice(0, eqIndex);
        const value = trimmed.slice(eqIndex + 1);
        process.env[key] = value;
      }
    }
  }
} catch (e) {}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const PORT = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // API endpoint
  if (req.url === '/api/analyze' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { url } = JSON.parse(body);
        if (!url) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Missing required field: url' }));
        }

        let normalizedUrl = url.trim();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
          normalizedUrl = 'https://' + normalizedUrl;
        }

        try { new URL(normalizedUrl); } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Invalid URL format' }));
        }

        if (!process.env.GROQ_API_KEY) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'GROQ_API_KEY not configured' }));
        }

        const results = await analyzeWebsite(normalizedUrl);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          url: normalizedUrl,
          analyzedAt: new Date().toISOString(),
          totalTime: results.totalTime,
          agents: results.agents,
          errors: results.errors,
          data: {
            techStack: results.techStack,
            seo: {
              score: results.seoReport.percentage,
              grade: results.seoReport.grade,
              issues: results.seoReport.issues,
              passes: results.seoReport.passes,
              data: results.seoReport.data
            },
            security: {
              score: results.securityReport.percentage,
              grade: results.securityReport.grade,
              present: results.securityReport.present,
              missing: results.securityReport.missing,
              warnings: results.securityReport.warnings
            },
            content: results.contentReport,
            aiAnalysis: results.aiAnalysis
          }
        }));
      } catch (error) {
        console.error('Analysis failed:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: error.message || 'Analysis failed',
          hint: 'Make sure the URL is accessible and not behind authentication'
        }));
      }
    });
    return;
  }

  // Static file serving from /public
  let filePath = req.url === '/' ? '/index.html' : req.url;
  const fullPath = join(__dirname, 'public', filePath);

  if (existsSync(fullPath)) {
    const ext = extname(fullPath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = readFileSync(fullPath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`\n  🔍 WebIntel AI running at http://localhost:${PORT}\n`);
});
