import { DEVLOGS_PAGE_SIZE, fetchExploreDevlogs } from './devlogs.js';

export async function load() {
    const devlogs = await fetchExploreDevlogs(0);
    const nextOffset = devlogs.length;

    return {
        devlogs,
        nextOffset,
        hasMore: devlogs.length === DEVLOGS_PAGE_SIZE
    };
}
