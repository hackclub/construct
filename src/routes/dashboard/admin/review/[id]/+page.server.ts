import { db } from '$lib/server/db/index.js';
import { project, user, devlog, t1Review } from '$lib/server/db/schema.js';
import { error, redirect } from '@sveltejs/kit';
import { eq, and, asc, sql } from 'drizzle-orm';
import type { Actions } from './$types';
import { sendSlackDM } from '$lib/server/slack.js';
import { getReviewHistory } from '../../getReviewHistory.server';
import { T1_PAYOUT_BRICKS } from '$lib/defs';

export async function load({ locals, params }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasT1Review) {
		throw error(403, { message: 'oi get out' });
	}

	const id: number = parseInt(params.id);

	const [queriedProject] = await db
		.select({
			project: {
				id: project.id,
				name: project.name,
				description: project.description,

				url: project.url,
				editorFileType: project.editorFileType,
				editorUrl: project.editorUrl,
				uploadedFileUrl: project.uploadedFileUrl,
				modelFile: project.modelFile,

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
			project.editorFileType,
			project.editorUrl,
			project.uploadedFileUrl,
			project.modelFile,
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

	return {
		project: queriedProject,
		devlogs,
		reviews: await getReviewHistory(id)
	};
}

export const actions = {
	default: async ({ locals, request, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasT1Review) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		const [queriedProject] = await db
			.select({
				id: project.id,
				name: project.name,
				userId: project.userId,
				status: project.status
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

		if (queriedProject.status === 'submitted' && action !== 'add_comment') {
			// Bricks payout for reviewer
			await db
				.update(user)
				.set({
					brick: locals.user.brick + T1_PAYOUT_BRICKS
				})
				.where(eq(user.id, locals.user.id));
		}

		let status: typeof project.status._.data | undefined = undefined;
		let statusMessage = '';

		switch (action) {
			case 'approve':
				status = 't1_approved';
				statusMessage = 'approved! :woah-dino:';
				break;
			case 'approve_no_print':
				status = 'printed';
				statusMessage = 'approved (no printing required)! :woah-dino:';
				break;
			case 'reject':
				status = 'rejected';
				statusMessage = "rejected. :sad_pepe:\nYou can still re-ship this when you're ready.";
				break;
			case 'reject_lock':
				status = 'rejected_locked';
				statusMessage = "rejected.\nYou can't re-ship this project.";
				break;
		}

		const [projectUser] = await db
			.select({
				slackId: user.slackId
			})
			.from(user)
			.where(eq(user.id, queriedProject.userId));

		if (projectUser && status) {
			await db
				.update(project)
				.set({
					status
				})
				.where(eq(project.id, id));

			const feedbackText = feedback
				? `\n\nHere's what they said about your project:\n${feedback}`
				: '';

			await sendSlackDM(
				projectUser.slackId,
				`Your project <https://construct.hackclub.com/dashboard/projects/${queriedProject.id}|${queriedProject.name}> has been ${statusMessage}${feedbackText}`
			);
		}

		return redirect(302, '/dashboard/admin/review');
	}
} satisfies Actions;
