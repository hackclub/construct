import { printersSingleList } from '$lib/printers.js';
import { error } from '@sveltejs/kit';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}

	// console.log(printersSingleList);

	return {};
}
