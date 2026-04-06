# WebIntel AI

**Website Competitive Intelligence Agent** — Drop any URL, get a full competitive intelligence dossier in 30 seconds.

Day 5 of [100 Days, 100 AI Agents](https://github.com/sathishlella) by **Sathish Lella**

---

## What It Does

WebIntel AI deploys 5 specialized sub-agents against any website URL:

```
URL Input
  |
  v
[1. Scraper Agent] -----> Fetches live page HTML + HTTP metadata
  |
  v (parallel)
[2. TechDetector Agent] -> Fingerprints 100+ technologies from HTML/scripts/headers
[3. SEO Auditor Agent] --> 75+ checks: title, meta, OG, structured data, headings, images
[4. Security Auditor] ---> 10 security headers + HTTPS + config weakness detection
[5. Content Extractor] --> CTAs, messaging, pricing signals, social links, forms
  |
  v
[AI Synthesizer] --------> Groq/Llama 3.3 generates competitive intelligence dossier
  |
  v
Full Dossier Output
```

This is NOT an AI wrapper. The tech detection, SEO audit, and security analysis are all rule-based engines that do real work. The AI layer only handles final synthesis.

## Why This Exists

- **BuiltWith** charges $495/mo for tech stack detection
- **Wappalyzer** charges $250/mo for similar data
- **Visualping** charges $3,000+/mo for enterprise competitive monitoring
- **SecurityHeaders.com** only checks headers, nothing else

WebIntel AI combines all of these into one free, open-source tool with AI-powered analysis on top.

## Tech Stack

| Layer | Tool |
|-------|------|
| Backend | Node.js (Vercel Serverless) |
| LLM | Groq API + Llama 3.3 70B |
| Scraping | Native fetch + Cheerio |
| Frontend | Vanilla JS (single-file, no build step) |
| Deployment | Vercel |

## Setup

### 1. Clone

```bash
git clone https://github.com/sathishlella/webintel-ai.git
cd webintel-ai
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env` and add your Groq API key:

```
GROQ_API_KEY=gsk_your_key_here
```

Get a free key at [console.groq.com](https://console.groq.com)

### 3. Run locally

```bash
npx vercel dev
```

Open `http://localhost:3000`

### 4. Deploy to Vercel

```bash
npx vercel --prod
```

Or click the button:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sathishlella/webintel-ai&env=GROQ_API_KEY)

## API Usage

```bash
curl -X POST https://your-app.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "stripe.com"}'
```

### Response

```json
{
  "success": true,
  "url": "https://stripe.com",
  "totalTime": 4523,
  "data": {
    "techStack": [...],
    "seo": { "score": 85, "grade": "B", "issues": [...] },
    "security": { "score": 70, "grade": "B", "present": [...], "missing": [...] },
    "content": { "ctas": [...], "pricing": {...}, "socialLinks": [...] },
    "aiAnalysis": "## EXECUTIVE SUMMARY\n..."
  }
}
```

## Architecture

```
Day-05-WebIntel/
├── api/
│   └── analyze.js           # Vercel serverless endpoint
├── lib/
│   ├── agent.js              # Main orchestrator + Groq synthesis
│   ├── techDetector.js       # 100+ tech fingerprint database
│   ├── seoAuditor.js         # 75+ SEO checks
│   ├── securityAuditor.js    # HTTP security header analysis
│   └── contentExtractor.js   # Content, CTA, pricing extraction
├── public/
│   └── index.html            # Premium UI (white/black, Inter font)
├── package.json
├── vercel.json
└── .env.example
```

## License

MIT

---

Open Source | [github.com/sathishlella](https://github.com/sathishlella)
