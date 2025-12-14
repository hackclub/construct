import { db } from '$lib/server/db/index.js';
import { devlog, project, user } from '$lib/server/db/schema.js';
import { eq, desc } from 'drizzle-orm';

// TODO: pagination
export async function load() {
	const devlogs = await db
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
        .orderBy(desc(devlog.createdAt))
        .limit(15);

	return {
		devlogs
	};
}
