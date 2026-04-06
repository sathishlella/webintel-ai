/**
 * WebIntel AI — Main Orchestrator Agent
 * Coordinates 5 sub-agents: Scraper, TechDetector, SEO Auditor, Security Auditor, Content Extractor
 * Synthesizes all findings into a competitive intelligence dossier via Groq AI
 */

import Groq from 'groq-sdk';
import * as cheerio from 'cheerio';
import { detectTechnologies } from './techDetector.js';
import { auditSEO } from './seoAuditor.js';
import { auditSecurity } from './securityAuditor.js';
import { extractContent } from './contentExtractor.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Agent 1: Scraper — Fetches page HTML and captures HTTP metadata
 */
async function scraperAgent(url) {
  const startTime = Date.now();

  // Normalize URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br'
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(15000)
  });

  const html = await response.text();
  const responseTime = Date.now() - startTime;

  // Extract all headers
  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    url: response.url, // Final URL after redirects
    originalUrl: url,
    statusCode: response.status,
    redirected: response.redirected,
    html,
    headers,
    responseTime,
    contentLength: html.length,
    contentType: headers['content-type'] || 'unknown'
  };
}

/**
 * Agent 5: Intelligence Synthesizer — Uses Groq to generate the final dossier
 */
async function synthesizerAgent(url, techStack, seoReport, securityReport, contentReport, scrapeMetadata) {
  const prompt = `You are a senior competitive intelligence analyst. Analyze this website data and produce a sharp, actionable intelligence dossier.

## Target: ${url}

## TECH STACK DETECTED (${techStack.length} technologies):
${techStack.map(t => `- ${t.name} [${t.category}]`).join('\n') || 'No technologies detected'}

## SEO AUDIT (Score: ${seoReport.percentage}% — Grade ${seoReport.grade}):
Issues: ${seoReport.issues.map(i => `[${i.severity}] ${i.message}`).join('; ')}
Passes: ${seoReport.passes.join('; ')}
Title: ${seoReport.data.title || 'None'}
Description: ${seoReport.data.metaDescription || 'None'}
H1: ${seoReport.data.headings?.h1Text?.join(', ') || 'None'}

## SECURITY (Score: ${securityReport.percentage}% — Grade ${securityReport.grade}):
Present: ${securityReport.present.map(h => h.name).join(', ') || 'None'}
Missing: ${securityReport.missing.map(h => h.name).join(', ') || 'None'}
Warnings: ${securityReport.warnings.map(w => w.message).join('; ') || 'None'}

## CONTENT & MESSAGING:
Hero: ${contentReport.messaging.heroText?.substring(0, 200) || 'N/A'}
Key Headings: ${contentReport.messaging.headings?.slice(0, 5).map(h => h.text).join(' | ') || 'N/A'}
CTAs: ${contentReport.ctas?.slice(0, 5).map(c => `"${c.text}" (${c.type})`).join(', ') || 'None'}
Social: ${contentReport.socialLinks?.map(s => s.platform).join(', ') || 'None'}
Pricing Signals: ${contentReport.pricing?.pricesMentioned?.join(', ') || 'No prices found'}
Free Option: ${contentReport.pricing?.hasFreeOption ? 'Yes' : 'No'}
Word Count: ${contentReport.contentMetrics?.wordCount || 'N/A'}
Has Blog: ${contentReport.contentMetrics?.hasBlog ? 'Yes' : 'No'}
Has FAQ: ${contentReport.contentMetrics?.hasFAQ ? 'Yes' : 'No'}
Has Testimonials: ${contentReport.contentMetrics?.hasTestimonials ? 'Yes' : 'No'}
Forms Found: ${contentReport.forms?.map(f => f.type).join(', ') || 'None'}

## PERFORMANCE:
Response Time: ${scrapeMetadata.responseTime}ms
Page Size: ${(scrapeMetadata.contentLength / 1024).toFixed(1)}KB
Status: ${scrapeMetadata.statusCode}
Redirected: ${scrapeMetadata.redirected}

---

Generate a competitive intelligence dossier with these EXACT sections:

1. **EXECUTIVE SUMMARY** (3-4 sentences): What this company does, their positioning, and overall digital maturity.

2. **TECH STACK ANALYSIS**: What their technology choices reveal about their engineering team, budget, and scale. Flag any outdated or risky tech.

3. **DIGITAL MARKETING ASSESSMENT**: Based on SEO, content strategy, CTAs, and messaging — how sophisticated is their marketing? What's working and what's not?

4. **SECURITY POSTURE**: Rate their security from 1-10 and explain what it means for enterprise buyers. Flag any dealbreakers.

5. **COMPETITIVE VULNERABILITIES**: 3-5 specific weaknesses a competitor could exploit. Be specific and actionable.

6. **OPPORTUNITIES**: 3-5 specific things this company should fix or improve, ranked by impact.

7. **OVERALL DIGITAL MATURITY SCORE**: Rate 1-100 with a one-line justification.

Be direct, specific, and analytical. No filler. Use the actual data provided, don't make assumptions about things not in the data.`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 3000,
    stream: false
  });

  return completion.choices[0]?.message?.content || 'Analysis could not be generated.';
}

/**
 * Main orchestrator — runs all 5 agents and synthesizes
 */
export async function analyzeWebsite(url) {
  const startTime = Date.now();
  const results = { url, agents: {}, errors: [] };

  // STEP 1: Scraper Agent
  let scrapeData;
  try {
    scrapeData = await scraperAgent(url);
    results.agents.scraper = {
      status: 'success',
      responseTime: scrapeData.responseTime,
      statusCode: scrapeData.statusCode,
      pageSize: scrapeData.contentLength,
      finalUrl: scrapeData.url
    };
  } catch (error) {
    results.errors.push({ agent: 'scraper', error: error.message });
    throw new Error(`Failed to fetch ${url}: ${error.message}`);
  }

  // STEP 2-4: Run TechDetector, SEO Auditor, Security Auditor, Content Extractor in parallel
  const [techStack, seoReport, securityReport, contentReport] = await Promise.all([
    // Agent 2: Tech Detector
    (async () => {
      try {
        const tech = detectTechnologies(scrapeData.html, scrapeData.headers);
        results.agents.techDetector = { status: 'success', count: tech.length };
        return tech;
      } catch (error) {
        results.errors.push({ agent: 'techDetector', error: error.message });
        return [];
      }
    })(),

    // Agent 3: SEO Auditor
    (async () => {
      try {
        const seo = auditSEO(scrapeData.html, scrapeData.url);
        results.agents.seoAuditor = { status: 'success', score: seo.percentage, grade: seo.grade };
        return seo;
      } catch (error) {
        results.errors.push({ agent: 'seoAuditor', error: error.message });
        return { score: 0, maxScore: 0, percentage: 0, grade: 'N/A', issues: [], passes: [], data: {} };
      }
    })(),

    // Agent 4: Security Auditor
    (async () => {
      try {
        const security = auditSecurity(scrapeData.headers, scrapeData.url);
        results.agents.securityAuditor = { status: 'success', score: security.percentage, grade: security.grade };
        return security;
      } catch (error) {
        results.errors.push({ agent: 'securityAuditor', error: error.message });
        return { score: 0, maxScore: 0, percentage: 0, grade: 'N/A', present: [], missing: [], warnings: [] };
      }
    })(),

    // Agent 5: Content Extractor
    (async () => {
      try {
        const content = extractContent(scrapeData.html, scrapeData.url);
        results.agents.contentExtractor = { status: 'success' };
        return content;
      } catch (error) {
        results.errors.push({ agent: 'contentExtractor', error: error.message });
        return { messaging: {}, ctas: [], navigation: [], socialLinks: [], contentMetrics: {}, pricing: null, forms: [] };
      }
    })()
  ]);

  // STEP 5: Intelligence Synthesizer
  let aiAnalysis;
  try {
    aiAnalysis = await synthesizerAgent(
      scrapeData.url, techStack, seoReport, securityReport, contentReport,
      { responseTime: scrapeData.responseTime, contentLength: scrapeData.contentLength, statusCode: scrapeData.statusCode, redirected: scrapeData.redirected }
    );
    results.agents.synthesizer = { status: 'success' };
  } catch (error) {
    results.errors.push({ agent: 'synthesizer', error: error.message });
    aiAnalysis = 'AI synthesis failed. Raw data is available below.';
  }

  results.totalTime = Date.now() - startTime;
  results.techStack = techStack;
  results.seoReport = seoReport;
  results.securityReport = securityReport;
  results.contentReport = contentReport;
  results.aiAnalysis = aiAnalysis;

  return results;
}
