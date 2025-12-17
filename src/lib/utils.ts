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
	t1_approved: 'On print queue',
	printing: 'Being printed',
	printed: 'Printed',
	t2_approved: 'Approved',
	finalized: 'Finalized',
	rejected: 'Rejected',
	rejected_locked: 'Rejected (locked)'
};

export default function fileSizeFromUrl(url: string): Promise<number> {
	return new Promise((resolve, reject) => {
		if (!url) {
			return reject(new Error('Invalid URL'));
		}

		fetch(url, { method: 'HEAD' })
			.then((response) => {
				if (!response.ok) {
					return reject(new Error(`Failed to get file size, status code: ${response.status}`));
				}

				const contentLength = response.headers.get('content-length');

				if (!contentLength) {
					return reject(new Error("Couldn't retrieve file size from headers"));
				}

				const size: number = parseInt(contentLength, 10);

				if (isNaN(size)) {
					return reject(new Error("Couldn't retrieve file size from headers"));
				}

				resolve(size);
			})
			.catch((err) => {
				reject(err);
			});
	});
}

export function formatMinutes(mins: number | null) {
	return Math.floor((mins ?? 0) / 60) + 'h ' + Math.floor((mins ?? 0) % 60) + 'min';
}
