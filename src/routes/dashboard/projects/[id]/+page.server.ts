import { db } from '$lib/server/db/index.js';
import { devlog, project } from '$lib/server/db/schema.js';
import { error, fail } from '@sveltejs/kit';
import { eq, and, desc, sql, or } from 'drizzle-orm';
import type { Actions } from './$types';
import { writeFile } from 'node:fs/promises';
import { extname } from 'path';
import {
	ALLOWED_IMAGE_TYPES,
	ALLOWED_MODEL_EXTS,
	ALLOWED_MODEL_TYPES,
	MAX_UPLOAD_SIZE
} from './config';
import sharp from 'sharp';
import {
	DEVLOG_DESCRIPTION_MAX_WORDS,
	DEVLOG_DESCRIPTION_MIN_WORDS,
	DEVLOG_MAX_TIME,
	DEVLOG_MIN_TIME
} from '$lib/defs';

export async function load({ params }) {
	const id: number = parseInt(params.id);

	// TODO: add this to the other endpoints
	if (!id) {
		throw error(404);
	}

	const queriedProject = await db
		.select({
			project: project,
			timeSpent: sql<number>`COALESCE(SUM(${devlog.timeSpent}), 0)`
		})
		.from(project)
		.leftJoin(devlog, and(eq(project.id, devlog.projectId), eq(devlog.deleted, false)))
		.where(and(eq(project.id, id), eq(project.deleted, false)))
		.groupBy(project.id)
		.get();

	if (!queriedProject) {
		throw error(404);
	}

	const devlogs = await db
		.select()
		.from(devlog)
		.where(and(eq(devlog.projectId, queriedProject.project.id), eq(devlog.deleted, false)))
		.orderBy(desc(devlog.createdAt));

	return {
		project: {
			id: queriedProject.project.id,
			userId: queriedProject.project.userId,
			name: queriedProject.project.name,
			description: queriedProject.project.description,
			url: queriedProject.project.url,
			createdAt: queriedProject.project.createdAt,
			updatedAt: queriedProject.project.updatedAt,
			timeSpent: queriedProject.timeSpent,
			status: queriedProject.project.status
		},
		devlogs: devlogs.map((devlog) => {
			return {
				id: devlog.id,
				description: devlog.description,
				timeSpent: devlog.timeSpent,
				image: devlog.image,
				model: devlog.model,
				createdAt: devlog.createdAt
			};
		}),
		validationConstraints: {
			timeSpent: {
				min: DEVLOG_MIN_TIME,
				max: DEVLOG_MAX_TIME,
				currentMax: await getMaxDevlogTime(id)
			},
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

		const queriedProject = await db
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
			.get();

		if (!queriedProject) {
			throw error(404);
		}

		const data = await request.formData();
		const description = data.get('description');
		const timeSpent = data.get('timeSpent');
		const imageFile = data.get('image') as File;
		const modelFile = data.get('model') as File;

		if (
			!description ||
			description.toString().trim().length < DEVLOG_DESCRIPTION_MIN_WORDS ||
			description.toString().trim().length > DEVLOG_DESCRIPTION_MAX_WORDS
		) {
			return fail(400, {
				fields: { description, timeSpent },
				invalid_description: true
			});
		}

		if (
			!timeSpent ||
			!parseInt(timeSpent.toString()) ||
			parseInt(timeSpent.toString()) < DEVLOG_MIN_TIME ||
			parseInt(timeSpent.toString()) > (await getMaxDevlogTime(id))
		) {
			return fail(400, {
				fields: { description, timeSpent },
				invalid_timeSpent: true
			});
		}

		// Validate image
		if (!(imageFile instanceof File)) {
			return fail(400, {
				fields: { description, timeSpent },
				invalid_image_file: true
			});
		}

		if (imageFile.size > MAX_UPLOAD_SIZE) {
			return fail(400, {
				fields: { description, timeSpent },
				invalid_image_file: true
			});
		}

		if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
			return fail(400, {
				fields: { description, timeSpent },
				invalid_image_file: true
			});
		}

		const imagePath = `/images/${crypto.randomUUID()}${extname(imageFile.name)}`;
		const imageFilename = `${process.env.UPLOADS_PATH ?? './uploads'}${imagePath}`;

		// Validate model
		let modelPath = null;

		if (modelFile.size) {
			if (modelFile.size > MAX_UPLOAD_SIZE) {
				return fail(400, {
					fields: { description, timeSpent },
					invalid_model_file: true
				});
			}

			if (
				!ALLOWED_MODEL_TYPES.includes(modelFile.type) ||
				!ALLOWED_MODEL_EXTS.includes(extname(modelFile.name))
			) {
				return fail(400, {
					fields: { description, timeSpent },
					invalid_model_file: true
				});
			}

			modelPath = `/models/${crypto.randomUUID()}${extname(modelFile.name)}`;

			const modelFilename = `${process.env.UPLOADS_PATH ?? './uploads'}${modelPath}`;
			await writeFile(modelFilename, Buffer.from(await modelFile.arrayBuffer()));
		}

		// Remove Exif metadata and save (we don't want another Hack Club classic PII leak :D)
		const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
		await writeFile(imageFilename, await sharp(imageBuffer).toBuffer());

		await db.insert(devlog).values({
			userId: locals.user.id,
			projectId: queriedProject.id,
			description: description.toString().trim(),
			image: '/uploads' + imagePath,
			model: modelPath ? '/uploads' + modelPath : null,
			timeSpent: parseInt(timeSpent.toString()),
			createdAt: new Date(Date.now()),
			updatedAt: new Date(Date.now())
		});

		return { success: true };
	}
} satisfies Actions;

async function getMaxDevlogTime(id: number) {
	const queriedDevlogArray = await db
		.select()
		.from(devlog)
		.where(and(eq(devlog.projectId, id), eq(devlog.deleted, false)))
		.orderBy(desc(devlog.createdAt))
		.limit(1);

	let devlogCurrentMaxTime;

	if (queriedDevlogArray.length == 0) {
		devlogCurrentMaxTime = DEVLOG_MAX_TIME;
	} else {
		const diff = new Date(Date.now()).valueOf() - queriedDevlogArray[0].createdAt.valueOf();

		devlogCurrentMaxTime = Math.min(Math.floor(Math.abs(diff / 1000 / 60)), DEVLOG_MAX_TIME);
	}

	return devlogCurrentMaxTime;
}
