import { env } from '$env/dynamic/private';

export function load({ locals }) {
	return {
		loggedIn: locals.session !== null,
		idvDomain: env.IDV_DOMAIN
	};
}
