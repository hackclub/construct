import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { and, eq, type SQLWrapper } from 'drizzle-orm';

export async function getCurrentlyPrinting(user: { id: number | SQLWrapper }) {
	const currentlyPrinting = await db
		.select({
			id: project.id,
			name: project.name
		})
		.from(project)
		.where(
			and(
				eq(project.printedBy, user.id),
				eq(project.status, 'printing'),
				eq(project.deleted, false)
			)
		);

	return currentlyPrinting;
}
