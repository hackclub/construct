import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { redirect, type Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;

		if (routeRequiresAuth(event.route.id ? event.route.id : '')) {
			return redirect(302, '/auth/idv');
		}

		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);

	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;

	if (routeRequiresAuth(event.route.id ? event.route.id : '') && !event.locals.user) {
		return redirect(302, '/auth/idv');
	}

	return resolve(event);
};

export const handle: Handle = sequence(Sentry.sentryHandle(), handleAuth);

function routeRequiresAuth(route: string) {
	return route.startsWith('/dashboard');
}

export const handleError = Sentry.handleErrorWithSentry();
