import { db } from '$lib/server/db/index.js';
import { project, devlog } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq, and, sql } from 'drizzle-orm';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}

	const projects = await db
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
			timeSpent: sql<number>`COALESCE(SUM(${devlog.timeSpent}), 0)`
		})
		.from(project)
		.leftJoin(devlog, and(eq(project.id, devlog.projectId), eq(devlog.deleted, false)))
		.where(and(eq(project.userId, locals.user.id), eq(project.deleted, false)))
		.groupBy(
			project.id,
			project.name,
			project.description,
			project.url,
			project.createdAt,
			project.status
		);

	const totalHours = projects.reduce((sum, p) => sum + (Number(p.timeSpent) || 0), 0) / 60;
	const finalHours =
		projects
			.filter((p) => p.status == 'finalized')
			.reduce((sum, p) => sum + (Number(p.timeSpent) || 0), 0) / 60;

	return {
		projects,
		totalHours: Math.round(totalHours * 10) / 10,
		finalHours: Math.round(finalHours * 10) / 10
	};
}
