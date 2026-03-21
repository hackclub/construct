const LAPSE_ENDPOINT = 'https://api.lapse.hackclub.com/api';

export function getIdFromUrl(url: string) {
	return url.match(/^https:\/\/lapse\.hackclub\.com\/timelapse\/([^\s/?#]+)$/)?.[1] ?? null;
}

export async function getLapse(id: string) {
	const res = await fetch(`${LAPSE_ENDPOINT}/timelapse/query?id=${encodeURIComponent(id)}`);

	const resJson = await res.json();

	if (resJson.ok) {
		const timelapse = resJson.data!.timelapse!;

		return {
			ok: true,
			timelapse: {
				name: timelapse.name!,
				description: timelapse.description!,
				playbackUrl: timelapse.playbackUrl!,
				thumbnailUrl: timelapse.thumbnailUrl!,
				duration: Math.round(timelapse.duration! / 60.0)
			}
		};
	} else {
		return {
			ok: false,
			error: resJson.error!,
			message: resJson.message!
		};
	}
}
