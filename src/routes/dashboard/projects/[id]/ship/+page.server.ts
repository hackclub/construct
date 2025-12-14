import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db/index.js';
import { devlog, project, user } from '$lib/server/db/schema.js';
import { error, redirect } from '@sveltejs/kit';
import { eq, and, or, sql } from 'drizzle-orm';
import type { Actions } from './$types';
import { sendSlackDM } from '$lib/server/slack.js';
import { ensureAiReviewsForProject } from '$lib/server/ai/ensure.js';

export async function load({ params, locals }) {
	const id: number = parseInt(params.id);

	if (!locals.user) {
		throw error(500);
	}

	const [queriedProject] = await db
		.select({
			id: project.id,
			name: project.name,
			description: project.description,
			url: project.url,
			createdAt: project.createdAt,
			status: project.status,
			timeSpent: sql<number>`COALESCE(SUM(${devlog.timeSpent}), 0)`,
			devlogCount: sql<number>`COALESCE(COUNT(${devlog.id}), 0)`
		})
		.from(project)
		.leftJoin(devlog, and(eq(project.id, devlog.projectId), eq(devlog.deleted, false)))
		.where(
			and(
				eq(project.id, id),
				eq(project.userId, locals.user.id),
				eq(project.deleted, false),
				or(eq(project.status, 'building'), eq(project.status, 'rejected'))
			)
		)
		.groupBy(
			project.id,
			project.name,
			project.description,
			project.url,
			project.createdAt,
			project.status
		)
		.limit(1);

	if (!queriedProject) {
		throw error(404);
	}

	return {
		project: queriedProject
	};
}

export const actions = {
	default: async ({ locals, params }) => {
		if (!locals.user) {
			throw error(500);
		}

		const id: number = parseInt(params.id);

		const [queriedProject] = await db
			.select({
				id: project.id,
				name: project.name,
				description: project.description,
				url: project.url,
				timeSpent: sql<number>`COALESCE(SUM(${devlog.timeSpent}), 0)`,
				devlogCount: sql<number>`COALESCE(COUNT(${devlog.id}), 0)`
			})
			.from(project)
			.leftJoin(devlog, and(eq(project.id, devlog.projectId), eq(devlog.deleted, false)))
			.where(
				and(
					eq(project.id, id),
					eq(project.userId, locals.user.id),
					eq(project.deleted, false),
					or(eq(project.status, 'building'), eq(project.status, 'rejected'))
				)
			)
			.groupBy(project.id, project.description, project.url)
			.limit(1);

		if (!queriedProject) {
			return error(404, { message: 'project not found' });
		}

		// Make sure it has atleast 2h
		if (queriedProject.timeSpent < 120) {
			return error(400, { message: 'minimum 2h needed to ship' });
		}

		if (queriedProject.description == '' || queriedProject.url == '') {
			return error(400, { message: 'project must have a description and Printables url' });
		}

		const projectDevlogs = await db
			.select()
			.from(devlog)
			.where(and(eq(devlog.projectId, queriedProject.id), eq(devlog.deleted, false)))
			.orderBy(devlog.createdAt);

		await db
			.update(project)
			.set({
				status: 'submitted'
			})
			.where(
				and(
					eq(project.id, queriedProject.id),
					eq(project.userId, locals.user.id),
					eq(project.deleted, false)
				)
			);

		await sendSlackDM(
			locals.user.slackId,
			`Hiya :wave: Your project <https://construct.hackclub.com/dashboard/projects/${queriedProject.id}|${queriedProject.name}> has been shipped and is now under review. We'll take a look and get back to you soon! :rocket:`
		);

		if (projectDevlogs.length > 0) {
			// Fire-and-forget AI pre-review so moderators have context ready.
			ensureAiReviewsForProject({
				project: {
					id: queriedProject.id,
					name: queriedProject.name,
					description: queriedProject.description,
					status: 'submitted',
					updatedAt: new Date()
				},
				devlogs: projectDevlogs.map((log) => ({
					...log,
					s3PublicUrl: env.S3_PUBLIC_URL ?? ''
				}))
			}).catch((err) => console.error('AI pre-review failed', err));
		}

		return redirect(303, '/dashboard/projects');
	}
} satisfies Actions;
