import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db/index.js';
import { aiDevlogReview, aiProjectReview, devlog, project, t1Review, user } from '$lib/server/db/schema.js';
import { error, redirect } from '@sveltejs/kit';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type { Actions } from './$types';
import { sendSlackDM } from '$lib/server/slack.js';
import { ensureAiReviewsForProject } from '$lib/server/ai/ensure.js';

const REVIEWABLE_STATUSES = new Set([
	'submitted',
	't1_approved',
	'printing',
	'printed',
	't2_approved',
	'finalized'
]);

export async function load({ locals, params }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasT1Review) {
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
		.orderBy(desc(devlog.createdAt));

	const devlogIds = devlogs.map((log) => log.id);

	let latestDevlogReviews: typeof aiDevlogReview.$inferSelect[] = [];
	let latestProjectReview: typeof aiProjectReview.$inferSelect | undefined;

	try {
		latestDevlogReviews = await db
			.select()
			.from(aiDevlogReview)
			.where(eq(aiDevlogReview.projectId, queriedProject.project.id));

		// filter reviews to only those matching current devlogs
		const devlogIdSet = new Set(devlogIds);
		latestDevlogReviews = latestDevlogReviews.filter((r) => devlogIdSet.has(r.devlogId));

		[latestProjectReview] = await db
			.select()
			.from(aiProjectReview)
			.where(eq(aiProjectReview.projectId, queriedProject.project.id));
	} catch (err) {
		console.error('AI review read failed', err);
		latestDevlogReviews = [];
		latestProjectReview = undefined;
	}

	if (REVIEWABLE_STATUSES.has(queriedProject.project.status)) {
		try {
			const ensured = await ensureAiReviewsForProject({
				project: {
					id: queriedProject.project.id,
					name: queriedProject.project.name,
					description: queriedProject.project.description,
					status: queriedProject.project.status,
					updatedAt: queriedProject.project.updatedAt
				},
				devlogs: devlogs.map((log) => ({
					...log,
					s3PublicUrl: env.S3_PUBLIC_URL ?? ''
				}))
			});

			latestDevlogReviews = ensured.devlogReviews;
			latestProjectReview = ensured.projectReview ?? latestProjectReview;
		} catch (err) {
			console.error('AI review ensure failed', err);
		}
	}

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
		t1Reviews,
		ai: {
			projectReview: latestProjectReview ?? null,
			devlogReviews: latestDevlogReviews
		}
	};
}

export const actions = {
	default: async ({ locals, request, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasT1Review) {
			throw error(403, { message: 'get out, peasant' });
		}

		const id: number = parseInt(params.id);

		const [queriedProject] = await db
			.select({
				id: project.id,
				name: project.name,
				userId: project.userId
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
		let statusMessage = '';

		switch (action) {
			case 'approve':
				status = 't1_approved';
				statusMessage = 'approved';
				break;
			case 'approve_no_print':
				status = 'printed';
				statusMessage = 'approved (no print)';
				break;
			case 'reject':
				status = 'rejected';
				statusMessage = 'rejected';
				break;
			case 'reject_lock':
				status = 'rejected_locked';
				statusMessage = 'rejected (locked)';
				break;
		}

		await db
			.update(project)
			.set({
				status
			})
			.where(eq(project.id, id));

		const [projectUser] = await db
			.select({
				slackId: user.slackId
			})
			.from(user)
			.where(eq(user.id, queriedProject.userId));

		if (projectUser) {
			const feedbackText = feedback ? `\n\nFeedback from reviewer:\n${feedback}` : '';
			const encouragement = statusMessage === 'rejected' ? ' You can try again whenever you\'re ready.' : statusMessage === 'rejected (locked)' ? ' Unfortunately, you can\'t resubmit this project. This decision is final. ' : ' Great work! :tada:';
			await sendSlackDM(
				projectUser.slackId,
				`Hiya :wave: Your project <https://construct.hackclub.com/dashboard/projects/${queriedProject.id}|${queriedProject.name}> has been ${statusMessage}!${feedbackText}${encouragement}`
			);
		}

		return redirect(302, '/dashboard/admin/review');
	}
} satisfies Actions;
