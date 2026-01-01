import { db } from '$lib/server/db/index.js';
import { impersonateAuditLog, user } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { desc, eq, inArray } from 'drizzle-orm';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const logs = await db
		.select({
			id: impersonateAuditLog.id,
			timestamp: impersonateAuditLog.timestamp,
			adminUser: {
				id: user.id,
				name: user.name,
				profilePicture: user.profilePicture
			},
			targetUserId: impersonateAuditLog.targetUserId
		})
		.from(impersonateAuditLog)
		.leftJoin(user, eq(impersonateAuditLog.adminUserId, user.id))
		.orderBy(desc(impersonateAuditLog.timestamp));

	// Fetch target users in a single query
	const targetUserIds = [...new Set(logs.map((log) => log.targetUserId))];
	const targetUsers =
		targetUserIds.length > 0
			? await db
					.select({
						id: user.id,
						name: user.name,
						profilePicture: user.profilePicture
					})
					.from(user)
					.where(inArray(user.id, targetUserIds))
			: [];

	// Create a map for efficient lookup
	const targetUserMap = new Map(targetUsers.map((u) => [u.id, u]));

	// Merge the data
	const logsWithUsers = logs.map((log) => ({
		...log,
		targetUser: targetUserMap.get(log.targetUserId)
	}));

	return {
		logs: logsWithUsers
	};
}
