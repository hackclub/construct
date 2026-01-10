import { redirect } from '@sveltejs/kit';

export function load({ locals }) {
	throw redirect(302, `/dashboard/users/${locals.user?.id}`);
}
