import { db } from '$lib/server/db/index.js';
import { project, user, devlog, t1Review, t2Review } from '$lib/server/db/schema.js';
import { error, redirect } from '@sveltejs/kit';
import { eq, and, asc, sql, desc } from 'drizzle-orm';
import type { Actions } from './$types';
import { sendSlackDM } from '$lib/server/slack.js';
import { airtableDB } from '$lib/server/airtable';
import { YswsProjectSubmissionTable } from '$lib/server/airtableTypes';
import { env } from '$env/dynamic/private';

export async function load({ locals, params }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasT2Review) {
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
		if (!locals.user.hasT2Review) {
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
					editorFileType: project.editorFileType,
					editorUrl: project.editorUrl,
					uploadedFileUrl: project.uploadedFileUrl,
					submittedToAirtable: project.submittedToAirtable
				},
				user: {
					id: user.id,
					name: user.name,
					slackId: user.slackId,
					idvId: user.idvId,
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
				user.id,
				user.name,
				user.slackId,
				user.idvId,
				user.trust,
				user.hackatimeTrust
			)
			.limit(1);

		if (!queriedProject) {
			return error(404, { message: 'project not found' });
		}

		const data = await request.formData();
		const action = data.get('action') as typeof t2Review.action._.data;
		const notes = data.get('notes')?.toString();
		const feedback = data.get('feedback')?.toString();

		if (action === null || notes === null || feedback === null) {
			return error(400);
		}

		let status: typeof project.status._.data | undefined = undefined;
		// let statusMessage = '';

		switch (action) {
			case 'approve':
				status = 'finalized';
				// statusMessage = 'approved! :woah-dino:';
				break;
			case 'reject':
				status = 'rejected';
				// statusMessage = "rejected. :sad_pepe:\nYou can still re-ship this when you're ready.";
				break;
		}

		if (airtableDB && action === 'approve' && !queriedProject.project.submittedToAirtable) {
			// const [latestDevlog] = await db
			// 	.select({
			// 		image: devlog.image
			// 	})
			// 	.from(devlog)
			// 	.where(and(eq(devlog.projectId, id), eq(devlog.deleted, false)))
			// 	.orderBy(desc(devlog.createdAt))
			// 	.limit(1);

			const repoUrl =
				queriedProject.project.editorFileType === 'upload'
					? `${env.S3_PUBLIC_URL}/${queriedProject.project.uploadedFileUrl}`
					: queriedProject.project.editorFileType === 'url'
						? queriedProject.project.editorUrl
						: null;

			const justificationAppend = `Project has ${queriedProject.devlogCount} ${queriedProject.devlogCount == 1 ? 'journal' : 'journals'} over ${Math.floor(
				queriedProject.timeSpent / 60
			)}h ${queriedProject.timeSpent % 60}min, each one with a 3d model file to show progress.\nAll journals can be found here: https://construct.hackclub.com/dashboard/projects/${queriedProject.project.id}`;
			// try {
			await airtableDB.insert(YswsProjectSubmissionTable, {
				demoUrl: queriedProject.project.url,
				repositoryUrl: repoUrl,

				slackUsername: queriedProject.user?.name,
				hoursEstimate: queriedProject.timeSpent / 60,
				optionalOverrideHoursSpent: queriedProject.timeSpent / 60,
				optionalOverrideHoursSpentJustification: notes
					? notes + '\n' + justificationAppend
					: justificationAppend,

				description: queriedProject.project.description,

				tempHold: false,
				identityVerified: true,
				idvRec: queriedProject.user?.idvId
			});
			// } catch {
			// 	return error(500, { message: 'airtable submission error' });
			// }
		}

		await db.insert(t2Review).values({
			projectId: id,
			userId: locals.user.id,
			action,
			currencyMultiplier: 1.0, // TODO: implement
			notes,
			feedback
		});

		await db
			.update(project)
			.set({
				status,
				submittedToAirtable: true
			})
			.where(eq(project.id, id));

		if (queriedProject.user) {
			// const feedbackText = feedback
			// 	? `\n\nHere's what they said about your project:\n${feedback}`
			// 	: '';
			// await sendSlackDM(
			// 	queriedProject.user.slackId,
			// 	`Your project <https://construct.hackclub.com/dashboard/projects/${queriedProject.project.id}|${queriedProject.project.name}> has been ${statusMessage}${feedbackText}`
			// );
		}

		return redirect(302, '/dashboard/admin/review');
	}
} satisfies Actions;
