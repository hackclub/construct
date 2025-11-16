import { db } from '$lib/server/db/index.js';
import { project, user, devlog } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq, and, sql, ne, inArray } from 'drizzle-orm';
import type { Actions } from './$types';

const PROJECT_FORMAT = {
	project: {
		id: project.id,
		name: project.name,
		description: project.description,
		url: project.url,
		createdAt: project.createdAt,
		status: project.status
	},
	timeSpent: sql<number>`COALESCE(SUM(${devlog.timeSpent}), 0)`,
	devlogCount: sql<number>`COALESCE(COUNT(${devlog.id}), 0)`
};

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasT1Review) {
		// TODO: make the 403 page a script that runs a memory filler to use up ram and crash your browser :D
		throw error(403, { message: 'get out, peasant' });
	}

	// TODO: make the database not stupid so it doesn't have to left join every single devlog
	const projects = await db
		.select(PROJECT_FORMAT)
		.from(project)
		.leftJoin(devlog, and(eq(project.id, devlog.projectId), eq(devlog.deleted, false)))
		.where(and(eq(project.deleted, false), eq(project.status, 'submitted')))
		.groupBy(project.id);

	const allProjects = await db
		.select({
			id: project.id,
			name: project.name
		})
		.from(project)
		.where(and(eq(project.deleted, false)));

	const users = await db
		.select({
			id: user.id,
			name: user.name
		})
		.from(user)
		.where(ne(user.status, 'banned'));

	return {
		allProjects,
		projects,
		users
	};
}

export const actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasT1Review) {
			throw error(403, { message: 'get out, peasant' });
		}

		const data = await request.formData();
		const statusFilter = data.getAll('status') as (typeof project.status._.data)[];

		const projectFilter = data.getAll('project').map((projectId) => {
			const parsedInt = parseInt(projectId.toString());
			if (!parsedInt) throw error(400, { message: 'malformed project filter' });
			return parseInt(projectId.toString());
		});

		const userFilter = data.getAll('user').map((userId) => {
			const parsedInt = parseInt(userId.toString());
			if (!parsedInt) throw error(400, { message: 'malformed user filter' });
			return parseInt(userId.toString());
		});

		console.log(statusFilter, projectFilter, userFilter);

		const projects = await db
			.select(PROJECT_FORMAT)
			.from(project)
			.leftJoin(devlog, and(eq(project.id, devlog.projectId), eq(devlog.deleted, false)))
			.where(
				and(
					eq(project.deleted, false),
					inArray(project.status, statusFilter),
					projectFilter.length > 0 ? inArray(project.id, projectFilter) : undefined,
					userFilter.length > 0 ? inArray(project.userId, userFilter) : undefined,
				)
			)
			.groupBy(project.id);

		return {
			projects,
			fields: {
				status: statusFilter,
				project: projectFilter,
				user: userFilter
			}
		};
	}
} satisfies Actions;
