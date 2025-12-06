import { env } from '$env/dynamic/public';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://7caab434460a1585f4c87baa1a692427@o40609.ingest.us.sentry.io/4510461147742208',

	integrations: [Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] })],

	tracesSampleRate: 1.0,

	environment: env.PUBLIC_ENV ?? 'dev',

	// Enable logs to be sent to Sentry
	enableLogs: true

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
});

// export const handleError = Sentry.handleErrorWithSentry();
