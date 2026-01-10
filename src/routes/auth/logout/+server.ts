import { redirect } from '@sveltejs/kit';
import { invalidateSession, deleteSessionTokenCookie, sessionCookieName } from '$lib/server/auth';

export async function GET(event) {
	const sessionToken = event.cookies.get(sessionCookieName);

	if (sessionToken) {
		invalidateSession(sessionToken);
		deleteSessionTokenCookie(event);
	}

	return redirect(302, '/');
}
