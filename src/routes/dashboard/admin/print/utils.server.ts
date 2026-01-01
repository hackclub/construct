import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { and, eq, type SQLWrapper } from 'drizzle-orm';

export async function getCurrentlyPrinting(user: { id: number | SQLWrapper }) {
	const [currentlyPrinting] = await db
		.select({
			id: project.id,
			name: project.name
		})
		.from(project)
		.where(
			and(
				eq(project.printedBy, user.id),
				eq(project.status, 'printing'),
				eq(project.deleted, false)
			)
		)
		.limit(1);

	return currentlyPrinting;
}

export function calculateFilamentUsage(gcodeText: string): number {
	const FILAMENT_DIAMETER = 1.75;
	const FILAMENT_DENSITY = 1.24;
	const lines = gcodeText.split('\n');
	let totalExtruded = 0;
	let currentE = 0;
	for (const line of lines) {
		const trimmed = line.trim().toUpperCase();
		if (trimmed.startsWith('G92')) {
			const eMatch = trimmed.match(/E([0-9.-]+)/);
			if (eMatch) {
				currentE = parseFloat(eMatch[1]);
			}
		} else if (trimmed.startsWith('G1')) {
			const eMatch = trimmed.match(/E([0-9.-]+)/);
			if (eMatch) {
				const newE = parseFloat(eMatch[1]);
				if (newE > currentE) {
					totalExtruded += newE - currentE;
				}
				currentE = newE;
			}
		}
	}
	const area = Math.PI * (FILAMENT_DIAMETER / 2) ** 2;
	const volumeCm3 = (totalExtruded * area) / 1000;
	return volumeCm3 * FILAMENT_DENSITY;
}
