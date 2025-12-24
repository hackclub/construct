import { db } from '$lib/server/db/index.js';
import { user, project, devlog } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq, and, desc } from 'drizzle-orm';

export async function load({ locals, params }) {
	const id: number = parseInt(params.id);

	if (!id) {
		throw error(404);
	}

	const [requestedUser] = await db.select().from(user).where(eq(user.id, id)).limit(1);

	if (!requestedUser) {
		throw error(404);
	}

	const projects = await db
		.select({
			id: project.id,
			name: project.name,
			url: project.url
		})
		.from(project)
		.where(and(eq(project.userId, id), eq(project.deleted, false)));

	const devlogs = await db
		.select({
			id: devlog.id,
			projectId: devlog.projectId,
			projectName: project.name,
			description: devlog.description,
			timeSpent: devlog.timeSpent,
			image: devlog.image,
			model: devlog.model,
			createdAt: devlog.createdAt
		})
		.from(devlog)
		.innerJoin(project, eq(devlog.projectId, project.id))
		.where(and(eq(devlog.userId, id), eq(devlog.deleted, false), eq(project.deleted, false)))
		.orderBy(desc(devlog.createdAt));

	return {
		requestedUser: {
			id: requestedUser.id,
			slackId: requestedUser.slackId,
			profilePicture: requestedUser.profilePicture,
			name: requestedUser.name,

			isPrinter: requestedUser.isPrinter,
			hasT1Review: requestedUser.hasT1Review,
			hasT2Review: requestedUser.hasT2Review,
			hasAdmin: requestedUser.hasAdmin,

			shopScore: requestedUser.shopScore,

			createdAt: requestedUser.createdAt,
			lastLoginAt: requestedUser.id === locals.user?.id ? requestedUser.lastLoginAt : null
		},
		projects: projects,
		devlogs: devlogs
	};
}
