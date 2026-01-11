import { db } from '$lib/server/db/index.js';
import { project, user, devlog, t2Review, legionReview } from '$lib/server/db/schema.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { eq, and, asc, sql, desc } from 'drizzle-orm';
import type { Actions } from './$types';
import { sendSlackDM } from '$lib/server/slack.js';
import { airtableBase } from '$lib/server/airtable';
import { env } from '$env/dynamic/private';
import { decrypt } from '$lib/server/encryption';
import { getUserData } from '$lib/server/idvUserData';
import { getReviewHistory } from '../../getReviewHistory.server';
import { calculatePayouts } from '$lib/currency';
import { isValidUrl } from '$lib/utils';
import { sanitizeUrl } from '@braintree/sanitize-url';

export async function load({ locals, params }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasT2Review) {
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
			project.updatedAt,
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
		reviews: await getReviewHistory(id),
		filamentUsed: await getLatestPrintFilament(id)
	};
}

export const actions = {
	review: async ({ locals, request, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasT2Review) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		const [queriedProject] = await db
			.select({
				project: {
					id: project.id,
					name: project.name,
					description: project.description,
					createdAt: project.createdAt,

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
					hackatimeTrust: user.hackatimeTrust,
					hasBasePrinter: user.hasBasePrinter,

					clay: user.clay,
					brick: user.brick,
					shopScore: user.shopScore
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
				project.createdAt,
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
				user.hackatimeTrust,
				user.hasBasePrinter,
				user.clay,
				user.brick,
				user.shopScore
			)
			.limit(1);

		if (!queriedProject) {
			return error(404, { message: 'project not found' });
		}

		const data = await request.formData();
		const notes = data.get('notes')?.toString();
		const feedback = data.get('feedback')?.toString();
		const shopScoreMultiplier = data.get('shopScoreMultiplier');
		const imageUrl = data.get('imageUrl');

		const imageUrlString =
			imageUrl && imageUrl.toString() ? sanitizeUrl(imageUrl.toString().trim()) : null;
		const imageUrlValid =
			imageUrlString &&
			imageUrlString.trim().length < 8000 &&
			isValidUrl(imageUrlString.trim()) &&
			imageUrlString !== 'about:blank';

		if (!imageUrlValid) {
			return fail(400, {
				invalidImageUrl: true
			});
		}

		if (notes === null || feedback === null) {
			return error(400);
		}

		if (
			!shopScoreMultiplier ||
			isNaN(parseFloat(shopScoreMultiplier.toString())) ||
			parseFloat(shopScoreMultiplier.toString()) < 0
		) {
			return error(400, { message: 'invalid market score multiplier' });
		}

		const parsedShopScoreMultiplier = parseFloat(shopScoreMultiplier.toString());

		const status: typeof project.status._.data | undefined = 'finalized';
		const statusMessage = 'finalised! :woah-dino:';

		if (airtableBase && !queriedProject.project.submittedToAirtable) {
			if (!queriedProject.user?.idvToken) {
				return fail(400, {
					message: 'IDV token revoked/expired, ask them to reauthenticate'
				});
			}

			let userData;

			try {
				const token = decrypt(queriedProject.user.idvToken);
				userData = await getUserData(token);
			} catch {
				return fail(400, {
					message: 'IDV token revoked/expired, ask them to reauthenticate'
				});
			}
			const { first_name, last_name, primary_email, birthday, addresses } = userData;

			const address = addresses.find((address: { primary: boolean }) => address.primary);

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
				'Code URL': repoUrl ?? '',
				'Playable URL': queriedProject.project.url ?? '',
				Description: queriedProject.project.description ?? '',

				'First Name': first_name ?? '',
				'Last Name': last_name ?? '',
				Email: primary_email ?? '',
				Birthday: birthday ?? '',
				'Address (Line 1)': address?.line_1 ?? '',
				City: address?.city ?? '',
				'State / Province': address?.state ?? '',
				Country: address?.country ?? '',
				'ZIP / Postal Code': address?.postal_code ?? '',

				'Hours estimate': queriedProject.timeSpent / 60,
				'Optional - Override Hours Spent': queriedProject.timeSpent / 60,
				'Optional - Override Hours Spent Justification': notes
					? notes + '\n' + justificationAppend
					: justificationAppend,
				Screenshot: [
					{
						url: imageUrlString
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
			notes,
			image: imageUrlString,
			feedback,
			shopScoreMultiplier: parsedShopScoreMultiplier
		});

		await db
			.update(project)
			.set({
				status,
				submittedToAirtable: true
			})
			.where(eq(project.id, id));

		if (queriedProject.user) {
			const payouts = calculatePayouts(
				queriedProject.timeSpent,
				await getLatestPrintFilament(id),
				parsedShopScoreMultiplier,
				queriedProject.user.hasBasePrinter,
				queriedProject.project.createdAt
			);

			await db
				.update(user)
				.set({
					clay: sql`${user.clay} + ${payouts.clay ?? 0}`,
					brick: sql`${user.brick} + ${payouts.bricks ?? 0}`,
					shopScore: sql`${user.shopScore} + ${payouts.shopScore}`
				})
				.where(eq(user.id, queriedProject.user.id));

			const feedbackText = feedback ? `\n\nHere's what they said:\n${feedback}` : '';

			await sendSlackDM(
				queriedProject.user.slackId,
				`Your project <https://construct.hackclub.com/dashboard/projects/${queriedProject.project.id}|${queriedProject.project.name}> has been ${statusMessage}${feedbackText}`
			);
		}

		return redirect(302, '/dashboard/admin/ysws-review');
	},

	override: async ({ locals, request, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasT2Review) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		const data = await request.formData();
		const devlogId = data.get('devlogId');
		const timeSpent = data.get('minutes');

		if (!devlogId || isNaN(parseInt(devlogId.toString()))) {
			return error(400, { message: 'invalid devlog id' });
		}

		const parsedDevlogId = parseInt(devlogId.toString());

		if (!timeSpent || isNaN(parseInt(timeSpent.toString())) || parseInt(timeSpent.toString()) < 0) {
			return error(400, { message: 'invalid time spent' });
		}

		const parsedTimeSpent = parseInt(timeSpent.toString());

		const [queriedDevlog] = await db
			.select({ id: devlog.id })
			.from(devlog)
			.where(
				and(eq(devlog.deleted, false), eq(devlog.projectId, id), eq(devlog.id, parsedDevlogId))
			)
			.limit(1);

		if (!queriedDevlog) {
			return error(404, { message: 'devlog not found' });
		}

		await db
			.update(devlog)
			.set({
				timeSpent: parsedTimeSpent
			})
			.where(
				and(eq(devlog.deleted, false), eq(devlog.projectId, id), eq(devlog.id, parsedDevlogId))
			);

		return { success: true };
	}
} satisfies Actions;

async function getLatestPrintFilament(id: number) {
	const [queriedReview] = await db
		.select({
			filament: legionReview.filamentUsed
		})
		.from(legionReview)
		.where(and(eq(legionReview.projectId, id), eq(legionReview.action, 'print')))
		.orderBy(desc(legionReview.timestamp))
		.limit(1);

	return queriedReview?.filament ?? 0;
}
