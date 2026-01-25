import { redirect } from '@sveltejs/kit';

export function load({ url }) {
	const code = url.searchParams.get('code');
	if (code) {
		throw redirect(302, `/dashboard/clubs?code=${encodeURIComponent(code)}`);
	}
	throw redirect(302, '/dashboard/clubs');
}
