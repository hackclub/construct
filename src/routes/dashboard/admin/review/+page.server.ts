import { db } from '$lib/server/db/index.js';
import { project, user, devlog, t1Review, legionReview, t2Review } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq, and, sql, ne, inArray, desc, gt } from 'drizzle-orm';
import type { Actions } from './$types';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasT1Review) {
		throw error(403, { message: 'oi get out' });
	}

	const projects = await getProjects(['submitted'], [], []);

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

	const t1Agg = db
		.$with('t1Agg')
		.as(
			db
				.select({ userId: t1Review.userId, t1Cnt: sql<number>`COUNT(*)`.as('t1Cnt') })
				.from(t1Review)
				.groupBy(t1Review.userId)
		);

	const legionAgg = db
		.$with('legionAgg')
		.as(
			db
				.select({ userId: legionReview.userId, legionCnt: sql<number>`COUNT(*)`.as('legionCnt') })
				.from(legionReview)
				.groupBy(legionReview.userId)
		);

	const t2Agg = db
		.$with('t2Agg')
		.as(
			db
				.select({ userId: t2Review.userId, t2Cnt: sql<number>`COUNT(*)`.as('t2Cnt') })
				.from(t2Review)
				.groupBy(t2Review.userId)
		);

	const totalExpr = sql<number>`COALESCE(${t1Agg.t1Cnt}, 0) + COALESCE(${legionAgg.legionCnt}, 0) + COALESCE(${t2Agg.t2Cnt}, 0)`;

	const leaderboard = await db
		.with(t1Agg, legionAgg, t2Agg)
		.select({ id: user.id, name: user.name, review_count: totalExpr })
		.from(user)
		.leftJoin(t1Agg, eq(t1Agg.userId, user.id))
		.leftJoin(legionAgg, eq(legionAgg.userId, user.id))
		.leftJoin(t2Agg, eq(t2Agg.userId, user.id))
		.where(and(ne(user.trust, 'red'), ne(user.hackatimeTrust, 'red'), gt(totalExpr, 0)))
		.orderBy(desc(totalExpr))
		.limit(10);

	return {
		allProjects,
		projects,
		users,
		leaderboard
	};
}

export const actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasT1Review) {
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
