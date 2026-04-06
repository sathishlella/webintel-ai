/**
 * Security Auditor — HTTP security header analysis
 * Checks CSP, HSTS, X-Frame-Options, CORS, and more
 */

const SECURITY_HEADERS = [
  {
    key: 'strict-transport-security',
    name: 'HSTS (HTTP Strict Transport Security)',
    weight: 15,
    description: 'Forces browsers to use HTTPS, preventing downgrade attacks',
    recommendation: 'Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload'
  },
  {
    key: 'content-security-policy',
    name: 'Content Security Policy (CSP)',
    weight: 15,
    description: 'Prevents XSS, clickjacking, and code injection attacks',
    recommendation: "Add a Content-Security-Policy header with strict directives (default-src 'self')"
  },
  {
    key: 'x-frame-options',
    name: 'X-Frame-Options',
    weight: 10,
    description: 'Prevents clickjacking by controlling iframe embedding',
    recommendation: 'Add header: X-Frame-Options: DENY or SAMEORIGIN'
  },
  {
    key: 'x-content-type-options',
    name: 'X-Content-Type-Options',
    weight: 10,
    description: 'Prevents MIME type sniffing attacks',
    recommendation: 'Add header: X-Content-Type-Options: nosniff'
  },
  {
    key: 'referrer-policy',
    name: 'Referrer Policy',
    weight: 8,
    description: 'Controls how much referrer information is shared',
    recommendation: 'Add header: Referrer-Policy: strict-origin-when-cross-origin'
  },
  {
    key: 'permissions-policy',
    name: 'Permissions Policy',
    weight: 8,
    description: 'Controls which browser features can be used (camera, microphone, geolocation)',
    recommendation: 'Add header: Permissions-Policy: camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'x-xss-protection',
    name: 'X-XSS-Protection',
    weight: 5,
    description: 'Legacy XSS filter (deprecated but still useful for older browsers)',
    recommendation: 'Add header: X-XSS-Protection: 1; mode=block'
  },
  {
    key: 'cross-origin-opener-policy',
    name: 'Cross-Origin Opener Policy (COOP)',
    weight: 7,
    description: 'Isolates browsing context to prevent Spectre-type attacks',
    recommendation: 'Add header: Cross-Origin-Opener-Policy: same-origin'
  },
  {
    key: 'cross-origin-resource-policy',
    name: 'Cross-Origin Resource Policy (CORP)',
    weight: 7,
    description: 'Prevents other origins from reading your resources',
    recommendation: 'Add header: Cross-Origin-Resource-Policy: same-origin'
  },
  {
    key: 'cross-origin-embedder-policy',
    name: 'Cross-Origin Embedder Policy (COEP)',
    weight: 5,
    description: 'Ensures all resources are loaded with proper CORS/CORP headers',
    recommendation: 'Add header: Cross-Origin-Embedder-Policy: require-corp'
  }
];

export function auditSecurity(headers, url) {
  const report = {
    score: 0,
    maxScore: 0,
    grade: 'F',
    present: [],
    missing: [],
    warnings: [],
    rawHeaders: {}
  };

  // Normalize header keys to lowercase
  const normalizedHeaders = {};
  for (const [key, value] of Object.entries(headers)) {
    normalizedHeaders[key.toLowerCase()] = value;
    report.rawHeaders[key.toLowerCase()] = value;
  }

  // Check HTTPS
  report.maxScore += 10;
  const isHttps = url.startsWith('https://');
  if (isHttps) {
    report.score += 10;
    report.present.push({ name: 'HTTPS', description: 'Site uses HTTPS encryption', weight: 10 });
  } else {
    report.missing.push({
      name: 'HTTPS',
      description: 'Site does not use HTTPS — all data transmitted in plaintext',
      recommendation: 'Enable HTTPS with a valid SSL/TLS certificate',
      weight: 10
    });
  }

  // Check each security header
  for (const header of SECURITY_HEADERS) {
    report.maxScore += header.weight;
    const value = normalizedHeaders[header.key];

    if (value) {
      report.score += header.weight;
      report.present.push({
        name: header.name,
        value: typeof value === 'string' ? value.substring(0, 100) : String(value),
        description: header.description,
        weight: header.weight
      });

      // Check for weak configurations
      if (header.key === 'strict-transport-security') {
        const maxAge = value.match(/max-age=(\d+)/);
        if (maxAge && parseInt(maxAge[1]) < 31536000) {
          report.warnings.push({
            name: header.name,
            message: `HSTS max-age is only ${maxAge[1]}s. Recommend at least 31536000 (1 year).`
          });
        }
        if (!value.includes('includeSubDomains')) {
          report.warnings.push({
            name: header.name,
            message: 'HSTS missing includeSubDomains directive'
          });
        }
      }

      if (header.key === 'content-security-policy') {
        if (value.includes("'unsafe-inline'")) {
          report.warnings.push({
            name: header.name,
            message: "CSP allows 'unsafe-inline' — weakens XSS protection"
          });
        }
        if (value.includes("'unsafe-eval'")) {
          report.warnings.push({
            name: header.name,
            message: "CSP allows 'unsafe-eval' — enables code injection risks"
          });
        }
      }
    } else {
      report.missing.push({
        name: header.name,
        description: header.description,
        recommendation: header.recommendation,
        weight: header.weight
      });
    }
  }

  // Check for information leakage
  const serverHeader = normalizedHeaders['server'];
  if (serverHeader) {
    const versionMatch = serverHeader.match(/[\d.]+/);
    if (versionMatch) {
      report.warnings.push({
        name: 'Server Version Disclosure',
        message: `Server header exposes version info: "${serverHeader}". Remove version numbers.`
      });
    }
  }

  const poweredBy = normalizedHeaders['x-powered-by'];
  if (poweredBy) {
    report.warnings.push({
      name: 'X-Powered-By Disclosure',
      message: `X-Powered-By header exposes technology: "${poweredBy}". Remove this header.`
    });
  }

  // Calculate grade
  report.percentage = Math.round((report.score / report.maxScore) * 100);
  report.grade = report.percentage >= 90 ? 'A+' :
                 report.percentage >= 80 ? 'A' :
                 report.percentage >= 70 ? 'B' :
                 report.percentage >= 55 ? 'C' :
                 report.percentage >= 40 ? 'D' : 'F';

  return report;
}
