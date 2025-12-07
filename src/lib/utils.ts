export function isValidUrl(string: string) {
	try {
		new URL(string);
		return true;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (err) {
		return false;
	}
}

export const projectStatuses = {
	building: 'Building',
	submitted: 'Submitted',
	t1_approved: 'Review approved',
	print_queue: 'On print queue',
	printing: 'Being printed',
	printed: 'Printed',
	t2_approved: 'YSWS review approved',
	finalized: 'Finalized',
	rejected: 'Rejected',
	rejected_locked: 'Rejected (locked)'
};
