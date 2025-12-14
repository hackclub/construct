import { db } from '$lib/server/db/index.js';
import { project, user, devlog, t1Review } from '$lib/server/db/schema.js';
import { error, redirect } from '@sveltejs/kit';
import { eq, and, asc, sql } from 'drizzle-orm';
import type { Actions } from './$types';

export async function load({ locals, params }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.isPrinter) {
		throw error(403, { message: 'get out, peasant' });
	}

	const id: number = parseInt(params.id);

	const [queriedProject] = await db
		.select({
			project: {
				id: project.id,
				name: project.name,
				description: project.description,
				url: project.url,
				createdAt: project.createdAt,
				updatedAt: project.updatedAt,
				status: project.status
			},
			user: {
				id: user.id,
				name: user.name,
				slackID: user.slackId,
				trust: user.trust,
				hackatimeTrust: user.hackatimeTrust
			},
			timeSpent: sql<number>`COALESCE(SUM(${devlog.timeSpent}), 0)`,
			devlogCount: sql<number>`COALESCE(COUNT(${devlog.id}), 0)`
		})
		.from(project)
		.leftJoin(devlog, and(eq(project.id, devlog.projectId), eq(devlog.deleted, false)))
		.leftJoin(user, eq(user.id, project.userId))
		.where(and(eq(project.id, id), eq(project.deleted, false)))
		.groupBy(
			project.id,
			project.name,
			project.description,
			project.url,
			project.createdAt,
			project.status,
			user.id,
			user.name,
			user.slackId,
			user.trust,
			user.hackatimeTrust
		)
		.limit(1);

	if (!queriedProject) {
		throw error(404, { message: 'project not found' });
	}

	const devlogs = await db
		.select()
		.from(devlog)
		.where(and(eq(devlog.projectId, queriedProject.project.id), eq(devlog.deleted, false)))
		.orderBy(asc(devlog.createdAt));

	const t1Reviews = await db
		.select({
			user: {
				id: user.id,
				name: user.name
			},
			action: t1Review.action,
			notes: t1Review.notes,
			feedback: t1Review.feedback,
			timestamp: t1Review.timestamp
		})
		.from(t1Review)
		.innerJoin(user, eq(user.id, t1Review.userId))
		.where(eq(t1Review.projectId, queriedProject.project.id))
		// .groupBy(t1Review.userId, t1Review.notes, t1Review.feedback, t1Review.timestamp)
		.orderBy(asc(t1Review.timestamp));

	return {
		project: queriedProject,
		devlogs,
		t1Reviews
	};
}

export const actions = {
	default: async ({ locals, request, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.isPrinter) {
			throw error(403, { message: 'get out, peasant' });
		}

		const id: number = parseInt(params.id);

		const [queriedProject] = await db
			.select({
				id: project.id
			})
			.from(project)
			.where(and(eq(project.deleted, false), eq(project.id, id)));

		if (!queriedProject) {
			return error(404, { message: 'project not found' });
		}

		const data = await request.formData();
		const action = data.get('action') as typeof t1Review.action._.data;
		const notes = data.get('notes')?.toString();
		const feedback = data.get('feedback')?.toString();

		if (action === null || notes === null || feedback === null) {
			return error(400);
		}

		await db.insert(t1Review).values({
			projectId: id,
			userId: locals.user.id,
			action,
			notes,
			feedback
		});

		let status: typeof project.status._.data | undefined = undefined;

		switch (action) {
			case 'approve':
				status = 't1_approved';
				break;
			case 'approve_no_print':
				status = 'printed';
				break;
			case 'reject':
				status = 'rejected';
				break;
			case 'reject_lock':
				status = 'rejected_locked';
				break;
		}

		await db
			.update(project)
			.set({
				status
			})
			.where(eq(project.id, id));

		return redirect(302, '/dashboard/admin/print');
	}
} satisfies Actions;
