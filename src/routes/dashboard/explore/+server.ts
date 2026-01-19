import { json } from '@sveltejs/kit';
import { DEVLOGS_PAGE_SIZE, fetchExploreDevlogs } from './devlogs.js';

export async function GET({ url }) {
	const offsetParam = url.searchParams.get('offset');
	const offset = offsetParam ? Number.parseInt(offsetParam, 10) : 0;

	if (!Number.isFinite(offset) || offset < 0) {
		return json({ error: 'Invalid offset' }, { status: 400 });
	}

	const devlogs = await fetchExploreDevlogs(offset);
	const nextOffset = offset + devlogs.length;

	return json({
		devlogs,
		nextOffset,
		hasMore: devlogs.length === DEVLOGS_PAGE_SIZE
	});
}
