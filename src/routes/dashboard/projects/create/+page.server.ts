import { db } from '$lib/server/db/index.js';
import { project } from '$lib/server/db/schema.js';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			throw error(500);
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

		const [addedProject] = await db
			.insert(project)
			.values({
				name: name.toString().trim(),
				description: description?.toString().trim(),
				userId: locals.user.id,
				printedBy: null
			})
			.returning();

		return redirect(303, `/dashboard/projects/${addedProject.id}`);
	}
} satisfies Actions;
