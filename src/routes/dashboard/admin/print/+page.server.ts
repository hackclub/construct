import { db } from '$lib/server/db/index.js';
import { project, user, devlog, legionReview } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq, and, sql, ne, inArray, desc, gt } from 'drizzle-orm';
import type { Actions } from './$types';
import { getCurrentlyPrinting } from './utils.server';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.isPrinter) {
		throw error(403, { message: 'oi get out' });
	}

	const projects = await getProjects(['t1_approved'], [], []);

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
		.where(and(ne(user.trust, 'red'), ne(user.hackatimeTrust, 'red'))); // hide banned users

	const legionAgg = db
		.$with('legionAgg')
		.as(
			db
				.select({ userId: legionReview.userId, legionCnt: sql<number>`COUNT(*)`.as('legionCnt') })
				.from(legionReview)
				.where(eq(legionReview.action, 'print'))
				.groupBy(legionReview.userId)
		);

	const totalExpr = sql<number>`COALESCE(${legionAgg.legionCnt}, 0)`;

	const leaderboard = await db
		.with(legionAgg)
		.select({ id: user.id, name: user.name, review_count: totalExpr })
		.from(user)
		.leftJoin(legionAgg, eq(legionAgg.userId, user.id))
		.where(and(ne(user.trust, 'red'), ne(user.hackatimeTrust, 'red'), gt(totalExpr, 0)))
		.orderBy(desc(totalExpr));

	const currentlyPrinting = await getCurrentlyPrinting(locals.user);

	return {
		allProjects,
		projects,
		users,
		currentlyPrinting,
		leaderboard
	};
}

export const actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.isPrinter) {
			throw error(403, { message: 'oi get out' });
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

		const projects = await getProjects(statusFilter, projectFilter, userFilter);

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

async function getProjects(
	statusFilter: (typeof project.status._.data)[],
	projectFilter: number[],
	userFilter: number[]
) {
	return await db
		.select({
			project: {
				id: project.id,
				name: project.name,
				description: project.description,
				url: project.url,
				createdAt: project.createdAt,
				status: project.status
			},
			user: {
				id: user.id,
				name: user.name
			},
			timeSpent: sql<number>`COALESCE(SUM(${devlog.timeSpent}), 0)`,
			devlogCount: sql<number>`COALESCE(COUNT(${devlog.id}), 0)`
		})
		.from(project)
		.leftJoin(devlog, and(eq(project.id, devlog.projectId), eq(devlog.deleted, false)))
		.leftJoin(user, eq(user.id, project.userId))
		.where(
			and(
				eq(project.deleted, false),
				statusFilter.length > 0 ? inArray(project.status, statusFilter) : undefined,
				projectFilter.length > 0 ? inArray(project.id, projectFilter) : undefined,
				userFilter.length > 0 ? inArray(project.userId, userFilter) : undefined
			)
		)
		.groupBy(
			project.id,
			project.name,
			project.description,
			project.url,
			project.createdAt,
			project.status,
			user.id,
			user.name
		);
}
