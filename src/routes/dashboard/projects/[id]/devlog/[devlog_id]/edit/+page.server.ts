import { db } from '$lib/server/db/index.js';
import { project, devlog } from '$lib/server/db/schema.js';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { and, eq } from 'drizzle-orm';
import { DEVLOG_DESCRIPTION_MAX_WORDS, DEVLOG_DESCRIPTION_MIN_WORDS } from '$lib/defs';

export async function load({ params, locals }) {
	const id: number = parseInt(params.id);
	const devlogId: number = parseInt(params.devlog_id);

	if (!locals.user) {
		throw error(500);
	}

	const queriedProject = await db
		.select()
		.from(project)
		.where(and(eq(project.id, id), eq(project.userId, locals.user.id), eq(project.deleted, false)))
		.get();

	if (!queriedProject) {
		throw error(404);
	}

	const queriedDevlog = await db
		.select()
		.from(devlog)
		.where(
			and(eq(devlog.id, devlogId), eq(devlog.userId, locals.user.id), eq(devlog.deleted, false))
		)
		.get();

	if (!queriedDevlog) {
		throw error(404);
	}

	return {
		devlog: {
			id: queriedDevlog.id,
			description: queriedDevlog.description,
			image: queriedDevlog.image,
			model: queriedDevlog.model,
			timeSpent: queriedDevlog.timeSpent,
			createdAt: queriedDevlog.createdAt
		},
		validationConstraints: {
			description: {
				min: DEVLOG_DESCRIPTION_MIN_WORDS,
				max: DEVLOG_DESCRIPTION_MAX_WORDS
			}
		}
	};
}

export const actions = {
	default: async ({ request, locals, params }) => {
		if (!locals.user) {
			throw error(500);
		}

		const id: number = parseInt(params.id);
		const devlogId: number = parseInt(params.devlog_id);

		const queriedProject = await db
			.select()
			.from(project)
			.where(
				and(eq(project.id, id), eq(project.userId, locals.user.id), eq(project.deleted, false))
			)
			.get();

		if (!queriedProject) {
			throw error(404);
		}

		const queriedDevlog = await db
			.select()
			.from(devlog)
			.where(
				and(eq(devlog.id, devlogId), eq(devlog.userId, locals.user.id), eq(devlog.deleted, false))
			)
			.get();

		if (!queriedDevlog) {
			throw error(404);
		}

		const data = await request.formData();
		const description = data.get('description');

		if (
			!description ||
			description.toString().trim().length < DEVLOG_DESCRIPTION_MIN_WORDS ||
			description.toString().trim().length > DEVLOG_DESCRIPTION_MAX_WORDS
		) {
			return fail(400, {
				fields: { description },
				invalid_description: true
			});
		}

		await db
			.update(devlog)
			.set({
				description: description.toString(),
				updatedAt: new Date(Date.now())
			})
			.where(
				and(eq(devlog.id, devlogId), eq(devlog.userId, locals.user.id), eq(devlog.deleted, false))
			);

		await db
			.update(project)
			.set({
				updatedAt: new Date(Date.now())
			})
			.where(and(eq(project.id, queriedDevlog.projectId)));

		return redirect(303, `/dashboard/projects/${id}`);
	}
} satisfies Actions;
