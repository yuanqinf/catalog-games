// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://42b263ca9c499fb6406f6abd99a97ae4@o4510248320892928.ingest.us.sentry.io/4510248325349376',

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Only enable Sentry in production or when explicitly enabled in development
  enabled:
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true',
});
