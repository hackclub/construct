import { db } from '$lib/server/db/index.js';
import { project, user, devlog, t1Review, t2Review } from '$lib/server/db/schema.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { eq, and, asc, sql, desc } from 'drizzle-orm';
import type { Actions } from './$types';
import { sendSlackDM } from '$lib/server/slack.js';
import { airtableBase } from '$lib/server/airtable';
import { env } from '$env/dynamic/private';
import { decrypt } from '$lib/server/encryption';
import { getUserData } from '$lib/server/idvUserData';

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

				submittedToAirtable: project.submittedToAirtable,

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
			project.submittedToAirtable,
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
					idvToken: user.idvToken,
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
				user.idvToken,
				user.trust,
				user.hackatimeTrust
			)
			.limit(1);

		if (!queriedProject) {
			return error(404, { message: 'project not found' });
		}

		const data = await request.formData();
		const notes = data.get('notes')?.toString();
		const feedback = data.get('feedback')?.toString();

		if (notes === null || feedback === null) {
			return error(400);
		}

		const status: typeof project.status._.data | undefined = 'finalized';
		const statusMessage = 'finalised! :woah-dino:';

		if (airtableBase && !queriedProject.project.submittedToAirtable) {
			const [latestDevlog] = await db
				.select({
					image: devlog.image
				})
				.from(devlog)
				.where(and(eq(devlog.projectId, id), eq(devlog.deleted, false)))
				.orderBy(desc(devlog.createdAt))
				.limit(1);

			if (!queriedProject.user?.idvToken) {
				return fail(400, {
					message: 'IDV token revoked/expired, ask them to reauthenticate'
				});
			}

			const token = decrypt(queriedProject.user.idvToken);
			let userData;

			try {
				userData = await getUserData(token);
			} catch {
				return fail(400, {
					message: 'IDV token revoked/expired, ask them to reauthenticate'
				});
			}
			const { first_name, last_name, primary_email, birthday, addresses } = userData;

			const address = addresses.find((address: { primary: boolean; }) => address.primary);

			const repoUrl =
				queriedProject.project.editorFileType === 'upload'
					? `${env.S3_PUBLIC_URL}/${queriedProject.project.uploadedFileUrl}`
					: queriedProject.project.editorFileType === 'url'
						? queriedProject.project.editorUrl
						: '';

			const justificationAppend = `Project has ${queriedProject.devlogCount} ${queriedProject.devlogCount == 1 ? 'journal' : 'journals'} over ${Math.floor(
				queriedProject.timeSpent / 60
			)}h ${queriedProject.timeSpent % 60}min, each one with a 3d model file to show progress.\nAll journals can be found here: https://construct.hackclub.com/dashboard/projects/${queriedProject.project.id}`;

			await airtableBase('YSWS Project Submission').create({
				'Repository URL': repoUrl ?? '',
				'Demo URL': queriedProject.project.url ?? '',
				Description: queriedProject.project.description ?? '',

				'First Name': first_name ?? '',
				'Last Name': last_name ?? '',
				'Email': primary_email ?? '',
				'Birthday': birthday ?? '',
				'Address (Line 1)': address?.line_1 ?? '',
				'City': address?.city ?? '',
				'State / Province': address?.state ?? '',
				'Country': address?.country ?? '',
				'ZIP / Postal Code': address?.postal_code ?? '',

				'Hours estimate': queriedProject.timeSpent / 60,
				'Optional - Override Hours Spent': queriedProject.timeSpent / 60,
				'Optional - Override Hours Spent Justification': notes
					? notes + '\n' + justificationAppend
					: justificationAppend,
				Screenshot: [
					{
						url: env.S3_PUBLIC_URL + '/' + latestDevlog.image
					}
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				] as any,
				'Slack Username': queriedProject.user?.name,
				idv_rec: queriedProject.user?.idvId,
				'Identity Verified': true,
				'Temp hold': false
			});
		}

		await db.insert(t2Review).values({
			projectId: id,
			userId: locals.user.id,
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
			const feedbackText = feedback ? `\n\nHere's what they said:\n${feedback}` : '';

			await sendSlackDM(
				queriedProject.user.slackId,
				`Your project <https://construct.hackclub.com/dashboard/projects/${queriedProject.project.id}|${queriedProject.project.name}> has been ${statusMessage}${feedbackText}`
			);
		}

		return redirect(302, '/dashboard/admin/review');
	}
} satisfies Actions;
