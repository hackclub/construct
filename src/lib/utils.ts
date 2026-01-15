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

export function calculateMarketPrice(
	minPrice: number,
	maxPrice: number,
	minShopScore: number,
	maxShopScore: number,
	userShopScore: number
) {
	if (userShopScore <= minShopScore) {
		return maxPrice;
	} else if (userShopScore >= maxShopScore) {
		return minPrice;
	} else {
		const priceDiff = maxPrice - minPrice;
		const shopScoreDiff = maxShopScore - minShopScore;
		const m = priceDiff / shopScoreDiff; // diff_y/diff_x

		const shopScoreRemainder = userShopScore - minShopScore;

		// y = -mx + c
		return Math.round(-m * shopScoreRemainder + maxPrice);
	}
}

export function getProjectLinkType(
	editorFileType: string | null,
	editorUrl: string | null,
	uploadedFileUrl: string | null
): string {
	if (editorFileType === 'url' && editorUrl?.includes('cad.onshape.com')) return 'onshape';
	if (editorFileType === 'url' && editorUrl?.includes('autodesk360.com')) return 'fusion-link';
	if (editorFileType === 'upload' && uploadedFileUrl?.endsWith('.f3d')) return 'fusion-file';
	if (editorFileType === 'upload' && uploadedFileUrl?.endsWith('.f3z')) return 'fusion-file';
	if (editorFileType === 'upload' && (uploadedFileUrl?.endsWith('.blend') || uploadedFileUrl?.endsWith('.blend1'))) return 'blender';
	if (editorFileType === 'upload' && uploadedFileUrl?.toLowerCase().endsWith('.fcstd')) return 'freecad';
	if (editorFileType === 'upload' && uploadedFileUrl?.endsWith('.slvs')) return 'solvespace';
	return 'unknown';
}
