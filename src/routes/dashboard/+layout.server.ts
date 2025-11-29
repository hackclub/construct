import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';

export function load({ locals }) {
	if (!locals.user) {
		throw redirect(302, '/auth/idv');
	}

	return {
		user: {
			id: locals.user.id,
			slackId: locals.user.slackId,
			name: locals.user.name,
			profilePicture: locals.user.profilePicture,
			clay: locals.user.clay,
			brick: locals.user.brick,
			shopScore: locals.user.shopScore,
			hasT1Review: locals.user.hasT1Review,
			hasT2Review: locals.user.hasT2Review,
			hasProjectAuditLogs: locals.user.hasProjectAuditLogs,
			hasAdmin: locals.user.hasAdmin
		},
		s3PublicUrl: env.S3_PUBLIC_URL
	};
}
