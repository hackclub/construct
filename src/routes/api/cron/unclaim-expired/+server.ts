import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db/index.js';
import { project, legionReview } from '$lib/server/db/schema.js';
import { eq, and, lt, isNotNull } from 'drizzle-orm';

const CLAIM_EXPIRY_DAYS = 7;

export async function POST({ request }) {
	const authHeader = request.headers.get('Authorization');
	const expectedToken = `Bearer ${env.APP_SECRET_KEY}`;

	if (!authHeader || authHeader !== expectedToken) {
		throw error(401, { message: 'Unauthorized' });
	}

	const expiryDate = new Date();
	expiryDate.setDate(expiryDate.getDate() - CLAIM_EXPIRY_DAYS);

	// Find all projects that are in 'printing' status with claimedAt older than 7 days
	const expiredClaims = await db
		.select({
			id: project.id,
			name: project.name,
			printedBy: project.printedBy,
			claimedAt: project.claimedAt
		})
		.from(project)
		.where(
			and(
				eq(project.status, 'printing'),
				eq(project.deleted, false),
				isNotNull(project.claimedAt),
				lt(project.claimedAt, expiryDate)
			)
		);

	// Unclaim each expired project
	for (const expiredProject of expiredClaims) {
		if (expiredProject.printedBy) {
			await db.insert(legionReview).values({
				projectId: expiredProject.id,
				userId: expiredProject.printedBy,
				action: 'unmark_for_printing',
				notes: 'Auto-unclaimed after 7 days without printing'
			});
		}

		await db
			.update(project)
			.set({
				status: 't1_approved',
				printedBy: null,
				claimedAt: null
			})
			.where(eq(project.id, expiredProject.id));
	}

	return json({
		success: true,
		unclaimedCount: expiredClaims.length,
		unclaimed: expiredClaims.map((p) => ({ id: p.id, name: p.name }))
	});
}
