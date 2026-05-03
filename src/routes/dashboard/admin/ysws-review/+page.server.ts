import { db } from '$lib/server/db/index.js';
import { project, user, devlog, t2Review } from '$lib/server/db/schema.js';
import { getProjectLinkType } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { eq, and, sql, ne, inArray, desc, gt, asc } from 'drizzle-orm';

export async function load({ locals, url }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasT2Review) {
		throw error(403, { message: 'oi get out' });
	}

	const hasFilters = url.searchParams.size > 0;
	const statusFilter = hasFilters
		? (url.searchParams.getAll('status') as (typeof project.status._.data)[])
		: (['printed'] as (typeof project.status._.data)[]);
	const projectFilter = url.searchParams
		.getAll('project')
		.map((id) => parseInt(id))
		.filter((id) => !isNaN(id) && id > 0);
	const userFilter = url.searchParams
		.getAll('user')
		.map((id) => parseInt(id))
		.filter((id) => !isNaN(id) && id > 0);
	const typeFilter = url.searchParams.getAll('type');
	const doubleDippingFilter = hasFilters
		? (url.searchParams.getAll('doubleDippingWith') as (typeof project.doubleDippingWith._.data)[])
		: (['none'] as (typeof project.doubleDippingWith._.data)[]);

	const projects = await getProjects(
		statusFilter,
		projectFilter,
		userFilter,
		typeFilter,
		doubleDippingFilter
	);

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

	const t2Agg = db.$with('t2Agg').as(
		db
			.select({ userId: t2Review.userId, t2Cnt: sql<number>`COUNT(*)`.as('t2Cnt') })
			.from(t2Review)
			.groupBy(t2Review.userId)
	);

	const totalExpr = sql<number>`COALESCE(${t2Agg.t2Cnt}, 0)`;

	const leaderboard = await db
		.with(t2Agg)
		.select({ id: user.id, name: user.name, review_count: totalExpr })
		.from(user)
		.leftJoin(t2Agg, eq(t2Agg.userId, user.id))
		.where(and(ne(user.trust, 'red'), ne(user.hackatimeTrust, 'red'), gt(totalExpr, 0)))
		.orderBy(desc(totalExpr));

	return {
		allProjects,
		projects,
		users,
		leaderboard,
		fields: {
			status: statusFilter,
			project: projectFilter,
			user: userFilter,
			type: typeFilter,
			doubleDippingWith: doubleDippingFilter
		}
	};
}

async function getProjects(
	statusFilter: (typeof project.status._.data)[],
	projectFilter: number[],
	userFilter: number[],
	typeFilter: string[],
	doubleDippingFilter: (typeof project.doubleDippingWith._.data)[]
) {
	return (
		await db
			.select({
				project: {
					id: project.id,
					name: project.name,
					description: project.description,
					url: project.url,
					editorFileType: project.editorFileType,
					editorUrl: project.editorUrl,
					uploadedFileUrl: project.uploadedFileUrl,
					status: project.status,
					createdAt: project.createdAt
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
					userFilter.length > 0 ? inArray(project.userId, userFilter) : undefined,
					doubleDippingFilter.length > 0
						? inArray(project.doubleDippingWith, doubleDippingFilter)
						: undefined
				)
			)
			.groupBy(
				project.id,
				project.name,
				project.description,
				project.url,
				project.editorFileType,
				project.editorUrl,
				project.uploadedFileUrl,
				project.createdAt,
				project.status,
				user.id,
				user.name
			)
			.orderBy(asc(project.updatedAt))
	).filter((item) =>
		typeFilter.length > 0
			? typeFilter.includes(
					getProjectLinkType(
						item.project.editorFileType,
						item.project.editorUrl,
						item.project.uploadedFileUrl
					)
				)
			: true
	);
}
