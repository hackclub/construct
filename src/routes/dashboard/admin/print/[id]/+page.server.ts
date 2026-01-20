import { db } from '$lib/server/db/index.js';
import { project, user, devlog, legionReview } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq, and, asc, sql } from 'drizzle-orm';
import type { Actions } from './$types';
// import { sendSlackDM } from '$lib/server/slack.js';
import { getReviewHistory } from '../../getReviewHistory.server';
import { getCurrentlyPrinting } from '../utils.server';

export async function load({ locals, params }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.isPrinter) {
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

				printedBy: project.printedBy,

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
			project.printedBy,
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

	const currentlyPrinting = await getCurrentlyPrinting(locals.user);

	return {
		project: queriedProject,
		devlogs,
		reviews: await getReviewHistory(id),
		currentlyPrinting
	};
}

export const actions = {
	markForPrint: async ({ locals, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.isPrinter) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		const [queriedProject] = await db
			.select({
				id: project.id,
				status: project.status
			})
			.from(project)
			.where(and(eq(project.id, id), eq(project.deleted, false)))
			.limit(1);

		if (!queriedProject) {
			return error(404, { message: 'project not found' });
		}

		if (queriedProject.status !== 't1_approved') {
			return error(403, { message: 'project is not marked as on print queue' });
		}

		await db.insert(legionReview).values({
			projectId: id,
			userId: locals.user.id,
			action: 'mark_for_printing'
		});

		await db
			.update(project)
			.set({
				status: 'printing',
				printedBy: locals.user.id
			})
			.where(eq(project.id, id));

		return {};
	},

	unmarkForPrint: async ({ locals, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.isPrinter) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		const [queriedProject] = await db
			.select({
				id: project.id,
				status: project.status,
				printedBy: project.printedBy
			})
			.from(project)
			.where(and(eq(project.id, id), eq(project.deleted, false)))
			.limit(1);

		if (!queriedProject) {
			return error(404, { message: 'project not found' });
		}

		if (queriedProject.status !== 'printing') {
			return error(403, { message: 'project is not marked as printing' });
		}

		await db.insert(legionReview).values({
			projectId: id,
			userId: locals.user.id,
			action: 'unmark_for_printing'
		});

		await db
			.update(project)
			.set({
				status: 't1_approved',
				printedBy: null
			})
			.where(eq(project.id, id));

		return {};
	},

	print: async ({ locals, request, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.isPrinter) {
			throw error(403, { message: 'oi get out' });
		}

		const currentlyPrinting = await getCurrentlyPrinting(locals.user);

		const id: number = parseInt(params.id);

		if (!currentlyPrinting.find((item) => item.id === id)) {
			return error(400, {
				message: "you can only print a project if you've marked it as you're printing it"
			});
		}

		const [queriedProject] = await db
			.select({
				id: project.id,
				status: project.status
			})
			.from(project)
			.where(and(eq(project.id, id), eq(project.deleted, false)))
			.limit(1);

		if (!queriedProject) {
			return error(404, { message: 'project not found' });
		}

		if (queriedProject.status !== 'printing') {
			return error(403, { message: 'project is not marked as currently printing' });
		}

		const data = await request.formData();
		const filamentUsed = data.get('filament');
		const notes = data.get('notes')?.toString();
		const feedback = data.get('feedback')?.toString();

		if (notes === null || feedback === null) {
			return error(400);
		}

		if (
			!filamentUsed ||
			isNaN(parseFloat(filamentUsed.toString())) ||
			parseFloat(filamentUsed.toString()) < 0
		) {
			return error(400, { message: 'invalid filament used' });
		}

		await db.insert(legionReview).values({
			projectId: id,
			userId: locals.user.id,
			filamentUsed: parseFloat(filamentUsed.toString()),
			notes,
			feedback,
			action: 'print'
		});

		await db
			.update(project)
			.set({
				status: 'printed'
			})
			.where(eq(project.id, id));

		// if (queriedProject.user) {
		// 	const feedbackText = feedback ? `\n\nHere's what they said:\n${feedback}` : '';

		// 	await sendSlackDM(
		// 		queriedProject.user.slackId,
		// 		`Your project <https://construct.hackclub.com/dashboard/projects/${queriedProject.project.id}|${queriedProject.project.name}> has been ${statusMessage}${feedbackText}`
		// 	);
		// }

		return {};
	},

	action: async ({ locals, request, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.isPrinter) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		const [queriedProject] = await db
			.select({
				id: project.id,
				status: project.status
			})
			.from(project)
			.where(and(eq(project.id, id), eq(project.deleted, false)))
			.limit(1);

		if (!queriedProject) {
			return error(404, { message: 'project not found' });
		}

		if (!['t1_approved', 'printing', 'printed'].includes(queriedProject.status)) {
			return error(403, { message: 'project is not in the print stage' });
		}

		const data = await request.formData();
		const action = data.get('action')?.toString() as typeof legionReview.action._.data | undefined;
		const notes = data.get('notes')?.toString();
		const feedback = data.get('feedback')?.toString();

		if (notes === null || feedback === null || action === null || action === undefined) {
			return error(400);
		}

		let status: typeof project.status._.data;

		if (action === 'already_printed') {
			status = 'printed';
		} else if (action === 'add_comment') {
			status = queriedProject.status;
		} else if (action === 'reject') {
			status = 'submitted';
		} else {
			return error(400);
		}

		await db.insert(legionReview).values({
			projectId: id,
			userId: locals.user.id,
			notes,
			feedback,
			action
		});

		await db
			.update(project)
			.set({
				status
			})
			.where(eq(project.id, id));

		return {};
	}
} satisfies Actions;
