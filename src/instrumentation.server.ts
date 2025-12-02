import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: process.env.SENTRY_DSN,

	tracesSampleRate: 1.0,

	environment: process.env.SENTRY_ENVIRONMENT,

	// Enable logs to be sent to Sentry
	enableLogs: true

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
});
