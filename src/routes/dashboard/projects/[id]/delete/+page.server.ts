import { db } from '$lib/server/db/index.js';
import { devlog, project } from '$lib/server/db/schema.js';
import { error, redirect } from '@sveltejs/kit';
import { eq, and, or, sql } from 'drizzle-orm';
import type { Actions } from './$types';

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

			editorFileType: project.editorFileType,
			editorUrl: project.editorUrl,
			uploadedFileUrl: project.uploadedFileUrl,

			createdAt: project.createdAt,
			status: project.status,
			timeSpent: sql<number>`COALESCE(SUM(${devlog.timeSpent}), 0)`
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
		.groupBy(project.id, project.name, project.description, project.url, project.createdAt, project.status)
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
			.select()
			.from(project)
			.where(
				and(
					eq(project.id, id),
					eq(project.userId, locals.user.id),
					eq(project.deleted, false),
					or(eq(project.status, 'building'), eq(project.status, 'rejected'))
				)
			)
			.limit(1);

		if (!queriedProject) {
			throw error(404);
		}

		// Delete project
		await db
			.update(project)
			.set({
				deleted: true,
				updatedAt: new Date(Date.now())
			})
			.where(
				and(
					eq(project.id, queriedProject.id),
					eq(project.userId, locals.user.id),
					eq(project.deleted, false)
				)
			);
		
		// Mark all associated devlogs as deleted
		await db
			.update(devlog)
			.set({
				deleted: true,
				updatedAt: new Date(Date.now())
			})
			.where(
				and(
					eq(devlog.projectId, queriedProject.id),
					eq(devlog.userId, locals.user.id),
				)
			);

		return redirect(303, '/dashboard/projects');
	}
} satisfies Actions;
