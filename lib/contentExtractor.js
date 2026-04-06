/**
 * Content Extractor — Extracts messaging, CTAs, value propositions, and content strategy
 */

import * as cheerio from 'cheerio';

export function extractContent(html, url) {
  const $ = cheerio.load(html);

  // Remove script, style, nav, footer for cleaner content extraction
  $('script, style, noscript, iframe').remove();

  const report = {
    messaging: {},
    ctas: [],
    navigation: [],
    socialLinks: [],
    contentMetrics: {},
    pricing: null,
    forms: []
  };

  // --- Extract Hero/Main Messaging ---
  const heroSelectors = ['[class*="hero"]', '[class*="banner"]', '[class*="jumbotron"]', '[id*="hero"]', 'header', 'main > section:first-child'];
  let heroText = '';
  for (const selector of heroSelectors) {
    const el = $(selector).first();
    if (el.length) {
      heroText = el.text().replace(/\s+/g, ' ').trim().substring(0, 500);
      break;
    }
  }
  if (!heroText) {
    heroText = $('h1').first().text().trim();
  }
  report.messaging.heroText = heroText;

  // --- Extract all headings as value props ---
  const headings = [];
  $('h1, h2, h3').each((i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.length > 3 && text.length < 200) {
      headings.push({ level: el.tagName.toLowerCase(), text });
    }
  });
  report.messaging.headings = headings.slice(0, 20);

  // --- Extract CTAs (buttons and prominent links) ---
  const ctaSelectors = [
    'a[class*="btn"]', 'a[class*="button"]', 'a[class*="cta"]',
    'button', '[class*="btn"]', '[role="button"]',
    'a[class*="primary"]', 'a[class*="action"]'
  ];
  const ctaTexts = new Set();
  for (const selector of ctaSelectors) {
    $(selector).each((i, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      const href = $(el).attr('href') || '';
      if (text.length >= 2 && text.length <= 50 && !ctaTexts.has(text.toLowerCase())) {
        ctaTexts.add(text.toLowerCase());
        report.ctas.push({
          text,
          href: href.startsWith('http') ? href : '',
          type: classifyCTA(text)
        });
      }
    });
  }
  report.ctas = report.ctas.slice(0, 15);

  // --- Extract Navigation Structure ---
  $('nav a, header a, [role="navigation"] a').each((i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    const href = $(el).attr('href') || '';
    if (text.length >= 2 && text.length <= 40) {
      report.navigation.push({ text, href: href.substring(0, 100) });
    }
  });
  report.navigation = [...new Map(report.navigation.map(n => [n.text, n])).values()].slice(0, 20);

  // --- Extract Social Links ---
  const socialPatterns = {
    twitter: /twitter\.com|x\.com/,
    linkedin: /linkedin\.com/,
    github: /github\.com/,
    facebook: /facebook\.com/,
    instagram: /instagram\.com/,
    youtube: /youtube\.com/,
    discord: /discord\.gg|discord\.com/,
    tiktok: /tiktok\.com/
  };
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href') || '';
    for (const [platform, pattern] of Object.entries(socialPatterns)) {
      if (pattern.test(href) && !report.socialLinks.find(s => s.platform === platform)) {
        report.socialLinks.push({ platform, url: href });
      }
    }
  });

  // --- Detect Pricing Indicators ---
  const pricingPatterns = /\$[\d,]+(?:\/mo|\/month|\/yr|\/year)?|€[\d,]+|£[\d,]+|pricing|free tier|free plan|starter|pro plan|enterprise/i;
  const bodyText = $('body').text();
  report.pricing = {
    hasPricingPage: $('a[href*="pricing"], a[href*="plans"]').length > 0,
    pricesMentioned: (bodyText.match(/\$[\d,]+(?:\.\d{2})?(?:\/mo(?:nth)?|\/yr|\/year)?/g) || []).slice(0, 5),
    hasFreeOption: /free tier|free plan|freemium|free trial|try free/i.test(bodyText)
  };

  // --- Count Forms ---
  $('form').each((i, el) => {
    const inputs = $(el).find('input:not([type="hidden"])');
    const action = $(el).attr('action') || '';
    report.forms.push({
      inputs: inputs.length,
      hasEmail: $(el).find('input[type="email"], input[name*="email"]').length > 0,
      type: classifyForm($(el))
    });
  });

  // --- Content Metrics ---
  const wordCount = bodyText.replace(/\s+/g, ' ').trim().split(' ').length;
  report.contentMetrics = {
    wordCount,
    estimatedReadTime: Math.ceil(wordCount / 250) + ' min',
    imageCount: $('img').length,
    videoCount: $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length,
    hasTestimonials: /testimonial|review|customer said|what .* say/i.test(html),
    hasFAQ: /faq|frequently asked|common questions/i.test(html),
    hasBlog: $('a[href*="/blog"], a[href*="/articles"]').length > 0
  };

  return report;
}

function classifyCTA(text) {
  const lower = text.toLowerCase();
  if (/sign up|register|create account|get started|start free/i.test(lower)) return 'signup';
  if (/log in|sign in/i.test(lower)) return 'login';
  if (/buy|purchase|order|add to cart/i.test(lower)) return 'purchase';
  if (/demo|trial|try/i.test(lower)) return 'trial';
  if (/contact|talk to|schedule|book/i.test(lower)) return 'contact';
  if (/learn|read|explore|discover/i.test(lower)) return 'learn';
  if (/download|install/i.test(lower)) return 'download';
  return 'other';
}

function classifyForm($form) {
  const html = $form.html() || '';
  if (/newsletter|subscribe|email updates/i.test(html)) return 'newsletter';
  if (/login|sign in|password/i.test(html)) return 'login';
  if (/sign up|register|create account/i.test(html)) return 'signup';
  if (/contact|message|inquiry/i.test(html)) return 'contact';
  if (/search/i.test(html)) return 'search';
  return 'other';
}
