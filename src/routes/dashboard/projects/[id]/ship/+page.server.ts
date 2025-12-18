import { db } from '$lib/server/db/index.js';
import { devlog, project } from '$lib/server/db/schema.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { eq, and, or, sql } from 'drizzle-orm';
import type { Actions } from './$types';
import { sendSlackDM } from '$lib/server/slack.js';
import { isValidUrl } from '$lib/utils';
import { MAX_UPLOAD_SIZE } from '../config';
import { extname } from 'path';
import { env } from '$env/dynamic/private';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { S3 } from '$lib/server/s3';
import { ship } from '$lib/server/db/schema.js';

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
			modelFile: project.modelFile,

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
	default: async ({ locals, params, request }) => {
		if (!locals.user) {
			throw error(500);
		}

		const id: number = parseInt(params.id);

		const data = await request.formData();
		const printablesUrl = data.get('printables_url');
		const editorUrl = data.get('editor_url');
		const editorFile = data.get('editor_file') as File;
		const modelFile = data.get('model_file') as File;

		const printablesUrlValid =
			printablesUrl &&
			printablesUrl.toString() &&
			printablesUrl.toString().trim().length < 8000 &&
			isValidUrl(printablesUrl.toString().trim());

		if (!printablesUrlValid) {
			return fail(400, {
				invalid_printables_url: true
			});
		}

		const printablesUrlObj = new URL(printablesUrl.toString().trim());

		const pathMatch = printablesUrlObj.pathname.match(/\/model\/(\d+)/);
		const modelId = pathMatch ? pathMatch[1] : '';

		const allowedLicenseIds = (env.PRINTABLES_ALLOWED_LICENSES_ID ?? '7,1,2,9,12,10,11')
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		if (allowedLicenseIds.length === 0) {
			return error(500, { message: 'license validation not configured' });
		}

		try {
			const graphqlResponse = await fetch('https://api.printables.com/graphql/', {
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({
					operationName: 'PrintDetail',
					query: `query PrintDetail($id: ID!) {
						print(id: $id) {
							id
							name
							license {
								id
								name
							}
						}
					}`,
					variables: { id: modelId }
				})
			});
			if (!graphqlResponse.ok) {
				return fail(400, {
					invalid_printables_url: true
				});
			}
			const graphqlData = await graphqlResponse.json();
			const license = graphqlData?.data?.print?.license;

			if (!license || !license.id) {
				return fail(400, {
					invalid_printables_url: true
				});
			}

			const licenseMatch = allowedLicenseIds.some((allowed) => allowed === license.id.toString());

			if (!licenseMatch) {
				return fail(400, {
					invalid_license: true
				});
			}
		} catch {
			return fail(400, {
				invalid_printables_url: true
			});
		}

		// Editor URL
		const editorUrlExists = editorUrl && editorUrl.toString();
		const editorUrlValid =
			editorUrlExists &&
			editorUrl.toString().trim().length < 8000 &&
			isValidUrl(editorUrl.toString().trim());

		if (editorUrlExists && !editorUrlValid) {
			return fail(400, {
				invalid_editor_url: true
			});
		}

		// Editor file
		const editorFileExists = editorFile instanceof File && editorFile.size > 0;
		const editorFileValid = editorFileExists && editorFile.size <= MAX_UPLOAD_SIZE;

		if (!editorUrlExists && !editorFileExists) {
			return error(400, { message: "editor file or url doesn't exist" });
		}

		if (editorUrlExists && editorFileExists) {
			return error(400, { message: 'editor file or url both exist' });
		}

		if (editorFileExists && !editorFileValid) {
			return fail(400, {
				invalid_editor_file: true
			});
		}

		// Model file
		const modelFileValid =
			modelFile instanceof File &&
			modelFile.size > 0 &&
			modelFile.size <= MAX_UPLOAD_SIZE &&
			extname(modelFile.name).toLowerCase() == '.3mf' &&
			[
				'model/3mf',
				'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
				'application/octet-stream',
				'text/plain'
			].includes(modelFile.type);

		if (!modelFileValid) {
			return fail(400, {
				invalid_model_file: true
			});
		}

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

		// Make sure it has at least 2h
		if (queriedProject.timeSpent < 120) {
			return error(400, { message: 'minimum 2h needed to ship' });
		}

		if (queriedProject.description == '') {
			return error(400, { message: 'project must have a description' });
		}

		// Editor file
		const editorFilePath = `ships/editor-files/${crypto.randomUUID()}${extname(editorFile.name)}`;

		if (editorFileExists) {
			const editorFileCommand = new PutObjectCommand({
				Bucket: env.S3_BUCKET_NAME,
				Key: editorFilePath,
				Body: Buffer.from(await editorFile.arrayBuffer())
			});
			await S3.send(editorFileCommand);
		}

		// Models
		const modelPath = `ships/models/${crypto.randomUUID()}${extname(modelFile.name).toLowerCase()}`;

		const modelCommand = new PutObjectCommand({
			Bucket: env.S3_BUCKET_NAME,
			Key: modelPath,
			Body: Buffer.from(await modelFile.arrayBuffer())
		});
		await S3.send(modelCommand);

		await db
			.update(project)
			.set({
				status: 'submitted',
				url: printablesUrl.toString(),
				editorFileType: editorUrlExists ? 'url' : 'upload',
				editorUrl: editorUrlExists ? editorUrl.toString() : undefined,
				uploadedFileUrl: editorFileExists ? editorFilePath : undefined,

				modelFile: modelPath
			})
			.where(
				and(
					eq(project.id, queriedProject.id),
					eq(project.userId, locals.user.id),
					eq(project.deleted, false)
				)
			);

		await db.insert(ship).values({
			userId: locals.user.id,
			projectId: queriedProject.id,
			url: printablesUrl.toString(),

			editorFileType: editorUrlExists ? 'url' : 'upload',
			editorUrl: editorUrlExists ? editorUrl.toString() : undefined,
			uploadedFileUrl: editorFileExists ? editorFilePath : undefined,

			modelFile: modelPath
		});

		await sendSlackDM(
			locals.user.slackId,
			`Hii :hyper-dino-wave:\n Your project <https://construct.hackclub.com/dashboard/projects/${queriedProject.id}|${queriedProject.name}> has been shipped and is now under review, we'll take a look and get back to you soon! :woooo:`
		);

		return redirect(303, '/dashboard/projects');
	}
} satisfies Actions;
