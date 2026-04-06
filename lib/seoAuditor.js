/**
 * SEO Auditor — Comprehensive SEO metadata analysis
 * Checks title, meta descriptions, OG tags, structured data, headings, links, images
 */

export function auditSEO(html, url) {
  const report = {
    score: 0,
    maxScore: 0,
    issues: [],
    passes: [],
    data: {}
  };

  // --- Title ---
  report.maxScore += 10;
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;
  report.data.title = title;
  if (!title) {
    report.issues.push({ severity: 'critical', message: 'Missing <title> tag' });
  } else if (title.length < 30) {
    report.score += 5;
    report.issues.push({ severity: 'warning', message: `Title too short (${title.length} chars). Aim for 50-60.` });
  } else if (title.length > 60) {
    report.score += 7;
    report.issues.push({ severity: 'minor', message: `Title may be truncated (${title.length} chars). Keep under 60.` });
  } else {
    report.score += 10;
    report.passes.push('Title tag is optimal length');
  }

  // --- Meta Description ---
  report.maxScore += 10;
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : null;
  report.data.metaDescription = description;
  if (!description) {
    report.issues.push({ severity: 'critical', message: 'Missing meta description' });
  } else if (description.length < 120) {
    report.score += 5;
    report.issues.push({ severity: 'warning', message: `Meta description too short (${description.length} chars). Aim for 150-160.` });
  } else if (description.length > 160) {
    report.score += 7;
    report.issues.push({ severity: 'minor', message: `Meta description may be truncated (${description.length} chars)` });
  } else {
    report.score += 10;
    report.passes.push('Meta description is optimal length');
  }

  // --- Open Graph Tags ---
  report.maxScore += 10;
  const ogTags = {};
  const ogRegex = /<meta[^>]*property=["'](og:[^"']+)["'][^>]*content=["']([^"']+)["']/gi;
  const ogRegex2 = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["'](og:[^"']+)["']/gi;
  let match;
  while ((match = ogRegex.exec(html)) !== null) ogTags[match[1]] = match[2];
  while ((match = ogRegex2.exec(html)) !== null) ogTags[match[2]] = match[1];
  report.data.openGraph = ogTags;

  const requiredOg = ['og:title', 'og:description', 'og:image', 'og:url'];
  const missingOg = requiredOg.filter(tag => !ogTags[tag]);
  if (missingOg.length === 0) {
    report.score += 10;
    report.passes.push('All essential Open Graph tags present');
  } else if (missingOg.length <= 2) {
    report.score += 5;
    report.issues.push({ severity: 'warning', message: `Missing OG tags: ${missingOg.join(', ')}` });
  } else {
    report.issues.push({ severity: 'critical', message: `Missing ${missingOg.length} Open Graph tags: ${missingOg.join(', ')}` });
  }

  // --- Twitter Card ---
  report.maxScore += 5;
  const twitterCard = html.match(/<meta[^>]*name=["']twitter:card["']/i);
  report.data.hasTwitterCard = !!twitterCard;
  if (twitterCard) {
    report.score += 5;
    report.passes.push('Twitter Card meta tags present');
  } else {
    report.issues.push({ severity: 'minor', message: 'Missing Twitter Card meta tags' });
  }

  // --- Heading Structure ---
  report.maxScore += 10;
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const h3Matches = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi) || [];
  report.data.headings = {
    h1Count: h1Matches.length,
    h2Count: h2Matches.length,
    h3Count: h3Matches.length,
    h1Text: h1Matches.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(Boolean)
  };

  if (h1Matches.length === 0) {
    report.issues.push({ severity: 'critical', message: 'Missing H1 heading' });
  } else if (h1Matches.length > 1) {
    report.score += 5;
    report.issues.push({ severity: 'warning', message: `Multiple H1 tags found (${h1Matches.length}). Use only one.` });
  } else {
    report.score += 10;
    report.passes.push('Single H1 tag present');
  }

  // --- Canonical URL ---
  report.maxScore += 5;
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  report.data.canonical = canonicalMatch ? canonicalMatch[1] : null;
  if (canonicalMatch) {
    report.score += 5;
    report.passes.push('Canonical URL set');
  } else {
    report.issues.push({ severity: 'warning', message: 'Missing canonical URL' });
  }

  // --- Favicon ---
  report.maxScore += 3;
  const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["']/i);
  if (faviconMatch) {
    report.score += 3;
    report.passes.push('Favicon present');
  } else {
    report.issues.push({ severity: 'minor', message: 'Missing favicon' });
  }

  // --- Language ---
  report.maxScore += 3;
  const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
  report.data.language = langMatch ? langMatch[1] : null;
  if (langMatch) {
    report.score += 3;
    report.passes.push(`Language attribute set: ${langMatch[1]}`);
  } else {
    report.issues.push({ severity: 'warning', message: 'Missing lang attribute on <html>' });
  }

  // --- Images without alt ---
  report.maxScore += 7;
  const allImages = html.match(/<img[^>]*>/gi) || [];
  const imagesWithoutAlt = allImages.filter(img => !img.match(/alt=["'][^"']+["']/i));
  report.data.images = {
    total: allImages.length,
    missingAlt: imagesWithoutAlt.length
  };
  if (allImages.length === 0 || imagesWithoutAlt.length === 0) {
    report.score += 7;
    report.passes.push('All images have alt text');
  } else if (imagesWithoutAlt.length <= 2) {
    report.score += 4;
    report.issues.push({ severity: 'warning', message: `${imagesWithoutAlt.length}/${allImages.length} images missing alt text` });
  } else {
    report.issues.push({ severity: 'critical', message: `${imagesWithoutAlt.length}/${allImages.length} images missing alt text` });
  }

  // --- Structured Data ---
  report.maxScore += 7;
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const jsonLdBlocks = [];
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      jsonLdBlocks.push(JSON.parse(match[1]));
    } catch (e) {}
  }
  report.data.structuredData = jsonLdBlocks.length > 0 ? jsonLdBlocks : null;
  if (jsonLdBlocks.length > 0) {
    report.score += 7;
    report.passes.push(`${jsonLdBlocks.length} structured data block(s) found (JSON-LD)`);
  } else {
    report.issues.push({ severity: 'warning', message: 'No structured data (JSON-LD) found' });
  }

  // --- Viewport ---
  report.maxScore += 5;
  const viewportMatch = html.match(/<meta[^>]*name=["']viewport["']/i);
  report.data.hasViewport = !!viewportMatch;
  if (viewportMatch) {
    report.score += 5;
    report.passes.push('Viewport meta tag present (mobile-friendly)');
  } else {
    report.issues.push({ severity: 'critical', message: 'Missing viewport meta tag — not mobile-friendly' });
  }

  // --- Internal/External Links ---
  const linkRegex = /<a[^>]*href=["']([^"']+)["']/gi;
  const links = { internal: 0, external: 0, nofollow: 0 };
  let parsedUrl;
  try { parsedUrl = new URL(url); } catch(e) {}
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[0];
    const linkUrl = match[1];
    if (linkUrl.startsWith('#') || linkUrl.startsWith('javascript:')) continue;
    if (parsedUrl && (linkUrl.startsWith('/') || linkUrl.includes(parsedUrl.hostname))) {
      links.internal++;
    } else if (linkUrl.startsWith('http')) {
      links.external++;
    }
    if (href.includes('nofollow')) links.nofollow++;
  }
  report.data.links = links;

  // Calculate percentage
  report.percentage = Math.round((report.score / report.maxScore) * 100);
  report.grade = report.percentage >= 90 ? 'A' : report.percentage >= 75 ? 'B' : report.percentage >= 60 ? 'C' : report.percentage >= 40 ? 'D' : 'F';

  return report;
}
