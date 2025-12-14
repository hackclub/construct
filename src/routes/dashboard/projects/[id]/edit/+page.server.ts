import { db } from '$lib/server/db/index.js';
import { project } from '$lib/server/db/schema.js';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { and, eq, or } from 'drizzle-orm';

export async function load({ params, locals }) {
	const id: number = parseInt(params.id);

	if (!locals.user) {
		throw error(500);
	}

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

	return {
		project: {
			id: queriedProject.id,
			name: queriedProject.name,
			description: queriedProject.description,
			url: queriedProject.url
		}
	};
}

export const actions = {
	default: async ({ request, locals, params }) => {
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

		const data = await request.formData();

		const name = data.get('name');
		const description = data.get('description');

		if (!(name && name.toString().trim().length > 0 && name.toString().trim().length < 80)) {
			return fail(400, {
				fields: { name, description },
				invalid_name: true
			});
		}

		if (!(!description || description.toString().trim().length < 1000)) {
			return fail(400, {
				fields: { name, description },
				invalid_description: true
			});
		}

		await db
			.update(project)
			.set({
				name: name.toString().trim(),
				description: description?.toString().trim(),
				updatedAt: new Date(Date.now())
			})
			.where(
				and(
					eq(project.id, queriedProject.id),
					eq(project.userId, locals.user.id),
					eq(project.deleted, false)
				)
			); // Don't need to check user id but eh extra security can't hurt

		return redirect(303, `/dashboard/projects/${queriedProject.id}`);
	}
} satisfies Actions;
