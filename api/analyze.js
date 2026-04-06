/**
 * WebIntel AI — Vercel Serverless API Endpoint
 * POST /api/analyze { url: "https://example.com" }
 */

import { analyzeWebsite } from '../lib/agent.js';

export const config = {
  maxDuration: 60 // Allow up to 60s for full analysis
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { url } = req.body || {};

  if (!url) {
    return res.status(400).json({ error: 'Missing required field: url' });
  }

  // Basic URL validation
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  try {
    new URL(normalizedUrl);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
  }

  try {
    const results = await analyzeWebsite(normalizedUrl);

    return res.status(200).json({
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
    });
  } catch (error) {
    console.error('Analysis failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Analysis failed',
      hint: 'Make sure the URL is accessible and not behind authentication'
    });
  }
}
