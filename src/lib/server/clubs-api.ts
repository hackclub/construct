import { env } from '$env/dynamic/private';

const BASE_URL = 'https://clubapi.hackclub.com';

function getHeaders(): HeadersInit {
	return {
		Authorization: env.CLUBS_API_KEY ?? ''
	};
}

export async function getLeaderClub(
	slackId: string
): Promise<{ clubName: string; clubStatus: string } | null> {
	try {
		const response = await fetch(
			`${BASE_URL}/leader/slack?slackid=${encodeURIComponent(slackId)}`,
			{
				headers: getHeaders()
			}
		);

		if (!response.ok) {
			console.error(`getLeaderClub failed: ${response.status} ${response.statusText}`);
			return null;
		}

		const data = await response.json();

		if (data.club_name) {
			return {
				clubName: data.club_name,
				clubStatus: data.club_status ?? ''
			};
		}

		return null;
	} catch (error) {
		console.error('getLeaderClub error:', error);
		return null;
	}
}

export async function verifyJoinCode(code: string): Promise<{ clubName: string } | null> {
	try {
		const response = await fetch(`${BASE_URL}/club/code?code=${encodeURIComponent(code)}`, {
			headers: getHeaders()
		});

		if (!response.ok) {
			console.error(`verifyJoinCode failed: ${response.status} ${response.statusText}`);
			return null;
		}

		const data = await response.json();

		if (data.club_name) {
			return {
				clubName: data.club_name
			};
		}

		return null;
	} catch (error) {
		console.error('verifyJoinCode error:', error);
		return null;
	}
}

export async function getClubMembers(clubName: string): Promise<string[] | null> {
	try {
		const response = await fetch(`${BASE_URL}/members?club_name=${encodeURIComponent(clubName)}`, {
			headers: getHeaders()
		});

		if (!response.ok) {
			console.error(`getClubMembers failed: ${response.status} ${response.statusText}`);
			return null;
		}

		const data = await response.json();

		if (data.members && Array.isArray(data.members)) {
			return data.members;
		}

		return null;
	} catch (error) {
		console.error('getClubMembers error:', error);
		return null;
	}
}
