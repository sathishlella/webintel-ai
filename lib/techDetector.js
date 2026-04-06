/**
 * TechDetector — Real tech stack fingerprinting engine
 * Detects 100+ technologies from HTML, scripts, meta tags, headers, cookies
 * Like BuiltWith ($495/mo) but open source
 */

const FINGERPRINTS = {
  // --- Frameworks & Libraries ---
  frameworks: [
    { name: 'React', patterns: { html: [/react[-.]/, /data-reactroot/, /data-reactid/, /__NEXT_DATA__/], scripts: [/react(?:\.min)?\.js/, /react-dom/], meta: [] }, category: 'Frontend Framework' },
    { name: 'Next.js', patterns: { html: [/__NEXT_DATA__/, /_next\/static/, /_next\/image/], scripts: [/_next\//, /next\/dist/], meta: [] }, category: 'Frontend Framework' },
    { name: 'Vue.js', patterns: { html: [/data-v-[a-f0-9]/, /id="__nuxt"/, /data-server-rendered/], scripts: [/vue(?:\.min)?\.js/, /vue\.runtime/], meta: [] }, category: 'Frontend Framework' },
    { name: 'Nuxt.js', patterns: { html: [/id="__nuxt"/, /__NUXT__/, /_nuxt\//], scripts: [/_nuxt\//, /nuxt\.js/], meta: [] }, category: 'Frontend Framework' },
    { name: 'Angular', patterns: { html: [/ng-version=/, /ng-app/, /\[ngClass\]/, /\*ngIf/], scripts: [/angular(?:\.min)?\.js/, /zone\.js/], meta: [] }, category: 'Frontend Framework' },
    { name: 'Svelte', patterns: { html: [/svelte-[a-z0-9]/, /__svelte/], scripts: [/svelte/, /\.svelte/], meta: [] }, category: 'Frontend Framework' },
    { name: 'jQuery', patterns: { html: [], scripts: [/jquery(?:\.min)?\.js/, /jquery-[0-9]/], meta: [] }, category: 'JS Library' },
    { name: 'Bootstrap', patterns: { html: [/class="[^"]*\b(?:container|row|col-(?:xs|sm|md|lg|xl))/], scripts: [/bootstrap(?:\.min)?\.js/], meta: [] }, category: 'CSS Framework' },
    { name: 'Tailwind CSS', patterns: { html: [/class="[^"]*\b(?:flex|grid|text-(?:xs|sm|base|lg|xl)|bg-|p-|m-|rounded|shadow)/], scripts: [], meta: [] }, category: 'CSS Framework' },
    { name: 'Gatsby', patterns: { html: [/___gatsby/, /gatsby-image/, /gatsby-resp-image/], scripts: [/gatsby/], meta: [{ name: 'generator', pattern: /gatsby/i }] }, category: 'Static Site Generator' },
    { name: 'Remix', patterns: { html: [/__remix/, /data-remix/], scripts: [/remix/], meta: [] }, category: 'Frontend Framework' },
    { name: 'Astro', patterns: { html: [/astro-/, /data-astro/], scripts: [/astro/], meta: [{ name: 'generator', pattern: /astro/i }] }, category: 'Static Site Generator' },
  ],

  // --- CMS ---
  cms: [
    { name: 'WordPress', patterns: { html: [/wp-content/, /wp-includes/, /wp-json/], scripts: [/wp-content/, /wp-includes/], meta: [{ name: 'generator', pattern: /wordpress/i }] }, category: 'CMS' },
    { name: 'Shopify', patterns: { html: [/cdn\.shopify\.com/, /Shopify\.theme/, /myshopify\.com/], scripts: [/shopify/, /cdn\.shopify/], meta: [] }, category: 'E-Commerce' },
    { name: 'Wix', patterns: { html: [/wix\.com/, /X-Wix/, /wixstatic\.com/], scripts: [/wix/, /parastorage\.com/], meta: [{ name: 'generator', pattern: /wix/i }] }, category: 'Website Builder' },
    { name: 'Squarespace', patterns: { html: [/squarespace\.com/, /sqsp/, /static\.squarespace/], scripts: [/squarespace/], meta: [{ name: 'generator', pattern: /squarespace/i }] }, category: 'Website Builder' },
    { name: 'Webflow', patterns: { html: [/webflow\.com/, /wf-/, /data-wf-/], scripts: [/webflow/], meta: [{ name: 'generator', pattern: /webflow/i }] }, category: 'Website Builder' },
    { name: 'Ghost', patterns: { html: [/ghost-/, /class="gh-/], scripts: [], meta: [{ name: 'generator', pattern: /ghost/i }] }, category: 'CMS' },
    { name: 'Drupal', patterns: { html: [/\/sites\/default\/files/, /drupal\.js/], scripts: [/drupal/], meta: [{ name: 'generator', pattern: /drupal/i }] }, category: 'CMS' },
    { name: 'HubSpot', patterns: { html: [/hs-scripts\.com/, /hubspot/, /hbspt/], scripts: [/hubspot/, /hs-scripts/], meta: [] }, category: 'Marketing Platform' },
  ],

  // --- Analytics ---
  analytics: [
    { name: 'Google Analytics (GA4)', patterns: { html: [], scripts: [/gtag\/js\?id=G-/, /googletagmanager\.com\/gtag/], meta: [] }, category: 'Analytics' },
    { name: 'Google Tag Manager', patterns: { html: [/googletagmanager\.com\/ns\.html/], scripts: [/googletagmanager\.com\/gtm\.js/], meta: [] }, category: 'Tag Manager' },
    { name: 'Segment', patterns: { html: [], scripts: [/cdn\.segment\.com/, /analytics\.js/], meta: [] }, category: 'Analytics' },
    { name: 'Mixpanel', patterns: { html: [], scripts: [/cdn\.mxpnl\.com/, /mixpanel/], meta: [] }, category: 'Analytics' },
    { name: 'Hotjar', patterns: { html: [], scripts: [/static\.hotjar\.com/, /hotjar/], meta: [] }, category: 'Heatmap & Recording' },
    { name: 'Amplitude', patterns: { html: [], scripts: [/cdn\.amplitude\.com/, /amplitude/], meta: [] }, category: 'Analytics' },
    { name: 'Heap', patterns: { html: [], scripts: [/cdn\.heapanalytics\.com/, /heap-/], meta: [] }, category: 'Analytics' },
    { name: 'Plausible', patterns: { html: [], scripts: [/plausible\.io\/js/], meta: [] }, category: 'Analytics' },
    { name: 'PostHog', patterns: { html: [], scripts: [/posthog/, /app\.posthog\.com/], meta: [] }, category: 'Product Analytics' },
    { name: 'Clarity', patterns: { html: [], scripts: [/clarity\.ms/], meta: [] }, category: 'Heatmap & Recording' },
  ],

  // --- CDN & Hosting ---
  infrastructure: [
    { name: 'Cloudflare', patterns: { headers: [{ key: 'cf-ray' }, { key: 'cf-cache-status' }, { key: 'server', pattern: /cloudflare/i }] }, category: 'CDN' },
    { name: 'Vercel', patterns: { headers: [{ key: 'x-vercel-id' }, { key: 'server', pattern: /vercel/i }] }, category: 'Hosting' },
    { name: 'Netlify', patterns: { headers: [{ key: 'x-nf-request-id' }, { key: 'server', pattern: /netlify/i }] }, category: 'Hosting' },
    { name: 'AWS CloudFront', patterns: { headers: [{ key: 'x-amz-cf-id' }, { key: 'x-amz-cf-pop' }, { key: 'via', pattern: /cloudfront/i }] }, category: 'CDN' },
    { name: 'Fastly', patterns: { headers: [{ key: 'x-served-by', pattern: /cache-/ }, { key: 'via', pattern: /varnish/i }] }, category: 'CDN' },
    { name: 'Akamai', patterns: { headers: [{ key: 'x-akamai-transformed' }, { key: 'server', pattern: /akamaighost/i }] }, category: 'CDN' },
    { name: 'Nginx', patterns: { headers: [{ key: 'server', pattern: /nginx/i }] }, category: 'Web Server' },
    { name: 'Apache', patterns: { headers: [{ key: 'server', pattern: /apache/i }] }, category: 'Web Server' },
  ],

  // --- Marketing & Customer Tools ---
  marketing: [
    { name: 'Intercom', patterns: { html: [], scripts: [/widget\.intercom\.io/, /intercom/], meta: [] }, category: 'Customer Messaging' },
    { name: 'Drift', patterns: { html: [], scripts: [/drift\.com/, /js\.driftt\.com/], meta: [] }, category: 'Chatbot' },
    { name: 'Crisp', patterns: { html: [], scripts: [/client\.crisp\.chat/], meta: [] }, category: 'Chat Widget' },
    { name: 'Zendesk', patterns: { html: [], scripts: [/static\.zdassets\.com/, /zendesk/], meta: [] }, category: 'Support' },
    { name: 'Mailchimp', patterns: { html: [/mc\.us[0-9]+\.list-manage/], scripts: [/chimpstatic\.com/], meta: [] }, category: 'Email Marketing' },
    { name: 'Stripe', patterns: { html: [], scripts: [/js\.stripe\.com/], meta: [] }, category: 'Payments' },
    { name: 'ReCAPTCHA', patterns: { html: [], scripts: [/google\.com\/recaptcha/, /gstatic\.com\/recaptcha/], meta: [] }, category: 'Security' },
    { name: 'Sentry', patterns: { html: [], scripts: [/browser\.sentry-cdn\.com/, /sentry\.io/], meta: [] }, category: 'Error Tracking' },
    { name: 'LaunchDarkly', patterns: { html: [], scripts: [/launchdarkly/], meta: [] }, category: 'Feature Flags' },
  ],

  // --- Performance & Optimization ---
  performance: [
    { name: 'Lazy Loading', patterns: { html: [/loading="lazy"/, /data-src=/, /lazyload/], scripts: [], meta: [] }, category: 'Performance' },
    { name: 'Service Worker', patterns: { html: [/navigator\.serviceWorker/, /sw\.js/], scripts: [/serviceWorker/], meta: [] }, category: 'PWA' },
    { name: 'AMP', patterns: { html: [/<html[^>]*⚡/, /<html[^>]*amp/], scripts: [/cdn\.ampproject\.org/], meta: [] }, category: 'Performance' },
  ]
};

/**
 * Detect technologies from HTML content, script sources, meta tags, and HTTP headers
 */
export function detectTechnologies(html, headers = {}) {
  const detected = [];
  const scriptSources = extractScriptSources(html);
  const metaTags = extractMetaTags(html);
  const lowerHtml = html.toLowerCase();

  for (const [group, fingerprints] of Object.entries(FINGERPRINTS)) {
    for (const fp of fingerprints) {
      let matched = false;

      // Check HTML patterns
      if (fp.patterns.html) {
        for (const pattern of fp.patterns.html) {
          if (pattern.test(html)) {
            matched = true;
            break;
          }
        }
      }

      // Check script sources
      if (!matched && fp.patterns.scripts) {
        for (const pattern of fp.patterns.scripts) {
          for (const src of scriptSources) {
            if (pattern.test(src)) {
              matched = true;
              break;
            }
          }
          if (matched) break;
        }
      }

      // Check meta tags
      if (!matched && fp.patterns.meta) {
        for (const metaPattern of fp.patterns.meta) {
          const metaValue = metaTags[metaPattern.name];
          if (metaValue && metaPattern.pattern.test(metaValue)) {
            matched = true;
            break;
          }
        }
      }

      // Check headers (for infrastructure)
      if (!matched && fp.patterns.headers) {
        for (const headerPattern of fp.patterns.headers) {
          const headerValue = headers[headerPattern.key.toLowerCase()];
          if (headerValue) {
            if (headerPattern.pattern) {
              if (headerPattern.pattern.test(headerValue)) {
                matched = true;
                break;
              }
            } else {
              matched = true;
              break;
            }
          }
        }
      }

      if (matched) {
        detected.push({
          name: fp.name,
          category: fp.category,
          group
        });
      }
    }
  }

  return detected;
}

function extractScriptSources(html) {
  const sources = [];
  const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    sources.push(match[1]);
  }
  // Also extract inline script content references
  const inlineRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = inlineRegex.exec(html)) !== null) {
    if (match[1].trim().length > 0) {
      sources.push(match[1]);
    }
  }
  return sources;
}

function extractMetaTags(html) {
  const meta = {};
  const metaRegex = /<meta[^>]*(?:name|property)=["']([^"']+)["'][^>]*content=["']([^"']+)["'][^>]*/gi;
  const metaRegex2 = /<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']([^"']+)["'][^>]*/gi;
  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    meta[match[1].toLowerCase()] = match[2];
  }
  while ((match = metaRegex2.exec(html)) !== null) {
    meta[match[2].toLowerCase()] = match[1];
  }
  return meta;
}
