import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // VULN-011: remove X-Powered-By header to avoid technology fingerprinting
  poweredByHeader: false,

  // VULN-008: security headers on all responses
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options',                    value: 'DENY' },
        { key: 'X-Content-Type-Options',             value: 'nosniff' },
        { key: 'Referrer-Policy',                    value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy',                 value: 'camera=(), microphone=(), geolocation=()' },
        // HSTS: enforce HTTPS for 1 year (only meaningful on prod behind TLS)
        { key: 'Strict-Transport-Security',          value: 'max-age=31536000; includeSubDomains; preload' },
        // CSP: allowlist only what the app actually uses
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            // Next.js requires unsafe-inline for its inline scripts/styles
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.accounts.dev https://*.clerk.accounts.dev https://*.posthog.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https://img.clerk.com",
            "connect-src 'self' https://api.groq.com https://api.anthropic.com https://*.clerk.accounts.dev wss://*.clerk.accounts.dev https://*.posthog.com",
            "worker-src 'self' blob:",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join('; '),
        },
      ],
    },
  ],

  // VULN-005: removed allowedOrigins: ['*'] — Next.js default CSRF protection restored.
  // If cross-origin dev proxies are needed, list specific origins explicitly.
};

export default nextConfig;
