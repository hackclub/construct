import { db } from '$lib/server/db/index.js';
import { devlog, project, user } from '$lib/server/db/schema.js';
import { desc, eq } from 'drizzle-orm';

export const DEVLOGS_PAGE_SIZE = 15;

export async function fetchExploreDevlogs(offset: number, limit = DEVLOGS_PAGE_SIZE) {
	return db
		.select({
			devlog: {
				id: devlog.id,
				description: devlog.description,
				image: devlog.image,
				model: devlog.model,
				timeSpent: devlog.timeSpent,
				createdAt: devlog.createdAt
			},
			project: {
				id: project.id,
				name: project.name
			},
			user: {
				id: user.id,
				name: user.name
			}
		})
		.from(devlog)
		.innerJoin(project, eq(devlog.projectId, project.id))
		.innerJoin(user, eq(devlog.userId, user.id))
		.where(eq(devlog.deleted, false))
		.orderBy(desc(devlog.createdAt), desc(devlog.id))
		.offset(offset)
		.limit(limit);
}
