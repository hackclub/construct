import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db/index.js';
import { aiDevlogReview, aiProjectReview } from '$lib/server/db/schema.js';
import type { Devlog, Project } from '$lib/server/db/schema.js';
import { reviewDevlogs } from '$lib/server/ai/reviewer.js';
import { eq, sql } from 'drizzle-orm';

type ProjectForReview = Pick<Project, 'id' | 'name' | 'description' | 'status' | 'updatedAt'>;
type DevlogForReview = Pick<Devlog, 'id' | 'description' | 'timeSpent' | 'image' | 'model' | 'createdAt' | 'updatedAt'> & {
	s3PublicUrl: string;
};

export async function ensureAiReviewsForProject({
	project,
	devlogs
}: {
	project: ProjectForReview;
	devlogs: DevlogForReview[];
}): Promise<{
	projectReview: typeof aiProjectReview.$inferSelect | null;
	devlogReviews: typeof aiDevlogReview.$inferSelect[];
}> {
	if (devlogs.length === 0) {
		return { projectReview: null, devlogReviews: [] };
	}

	const devlogIds = devlogs.map((log) => log.id);

	const existingDevlogReviews = await db
		.select()
		.from(aiDevlogReview)
		.where(eq(aiDevlogReview.projectId, project.id));

	// Build quick lookup
	const existingMap = new Map(existingDevlogReviews.map((r) => [r.devlogId, r]));

	const [existingProjectReview] = await db
		.select()
		.from(aiProjectReview)
		.where(eq(aiProjectReview.projectId, project.id));

	if (!env.AI_API_KEY) {
		return {
			projectReview: existingProjectReview ?? null,
			devlogReviews: existingDevlogReviews
		};
	}

	const needsDevlogReview = devlogs.some((log) => {
		const review = existingMap.get(log.id);
		return !review || log.updatedAt > review.updatedAt;
	});

	const needsProjectReview = !existingProjectReview || project.updatedAt > existingProjectReview.updatedAt;

	if (!needsDevlogReview && !needsProjectReview) {
		return {
			projectReview: existingProjectReview ?? null,
			devlogReviews: existingDevlogReviews
		};
	}

	const { projectReview, devlogReviews } = await reviewDevlogs({ project, devlogs });

	for (const review of devlogReviews) {
		await db
			.insert(aiDevlogReview)
			.values({
				devlogId: review.devlogId,
				projectId: review.projectId,
				approved: review.approved,
				rationale: review.rationale,
				prompt: review.prompt,
				model: review.model
			})
			.onConflictDoUpdate({
				target: aiDevlogReview.devlogId,
				set: {
					projectId: review.projectId,
					approved: review.approved,
					rationale: review.rationale,
					prompt: review.prompt,
					model: review.model,
					updatedAt: sql`now()`
				}
			});
	}

	await db
		.insert(aiProjectReview)
		.values({
			projectId: project.id,
			overallApproved: projectReview.overallApproved,
			summary: projectReview.summary,
			prompt: projectReview.prompt,
			model: projectReview.model
		})
		.onConflictDoUpdate({
			target: aiProjectReview.projectId,
			set: {
				overallApproved: projectReview.overallApproved,
				summary: projectReview.summary,
				prompt: projectReview.prompt,
				model: projectReview.model,
				updatedAt: sql`now()`
			}
		});

	const latestDevlogReviews = await db
		.select()
		.from(aiDevlogReview)
		.where(eq(aiDevlogReview.projectId, project.id));

	const [latestProjectReview] = await db
		.select()
		.from(aiProjectReview)
		.where(eq(aiProjectReview.projectId, project.id));

	return {
		projectReview: latestProjectReview ?? null,
		devlogReviews: latestDevlogReviews
	};
}
