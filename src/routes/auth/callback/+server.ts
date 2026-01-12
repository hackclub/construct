import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db/index.js';
import { user } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import {
	SESSION_EXPIRY_DAYS,
	DAY_IN_MS,
	createSession,
	setSessionTokenCookie,
	generateSessionToken
} from '$lib/server/auth.js';
import { encrypt } from '$lib/server/encryption.js';
import { getUserData } from '$lib/server/idvUserData';
import { airtableBase } from '$lib/server/airtable';

export async function GET(event) {
	const url = event.url;
	const code = url.searchParams.get('code');

	// !urlState || !code
	if (!code) {
		return error(400, { message: 'no oauth code, hmm what happened here' });
	}

	// Get token
	const tokenURL = new URL(`https://${env.IDV_DOMAIN}/oauth/token`);

	const urlencoded = new URLSearchParams();
	urlencoded.append('grant_type', 'authorization_code');
	urlencoded.append('client_id', env.IDV_CLIENT_ID ?? '');
	urlencoded.append('client_secret', env.IDV_CLIENT_SECRET ?? '');
	urlencoded.append('redirect_uri', `${url.protocol}//${url.host}/auth/callback`);
	urlencoded.append('code', code);

	const tokenRes = await fetch(tokenURL, {
		method: 'POST',
		body: urlencoded
	});

	if (!tokenRes.ok) {
		return redirect(302, '/auth/failed');
	}

	const token = (await tokenRes.json()).access_token;

	// Get user data
	let userData;

	try {
		userData = await getUserData(token);
	} catch {
		return redirect(302, '/auth/failed');
	}

	const { id, slack_id, first_name, last_name, primary_email, ysws_eligible } = userData;

	if (!ysws_eligible) {
		return redirect(302, '/auth/ineligible');
	}

	// Get slack data
	const slackProfileURL = new URL('https://slack.com/api/users.info');
	slackProfileURL.searchParams.set('user', slack_id);

	const slackProfileBody = new URLSearchParams();
	slackProfileBody.append('token', env.SLACK_BOT_TOKEN ?? '');

	const slackProfileRes = await fetch(slackProfileURL, {
		method: 'POST',
		body: slackProfileBody
	});

	const slackProfileResJSON = await slackProfileRes.json();

	if (!slackProfileResJSON.ok) {
		console.error('Failed to fetch user profile');

		return redirect(302, '/auth/failed');
	}

	const slackProfile = slackProfileResJSON['user'];

	const profilePic =
		slackProfile['profile']['image_1024'] ??
		slackProfile['profile']['image_512'] ??
		slackProfile['profile']['image_192'] ??
		slackProfile['profile']['image_72'] ??
		slackProfile['profile']['image_48'] ??
		slackProfile['profile']['image_32'] ??
		slackProfile['profile']['image_24'];

	const username =
		slackProfile['profile']['display_name'] !== ''
			? slackProfile['profile']['display_name']
			: slackProfile['profile']['real_name'];

	if (env.BETA_CHANNEL_ID && env.BETA_CHANNEL_ID.length > 0) {
		const channelMembersURL = new URL('https://slack.com/api/conversations.members');
		channelMembersURL.searchParams.set('channel', env.BETA_CHANNEL_ID);

		const channelMembersBody = new URLSearchParams();
		channelMembersBody.append('token', env.SLACK_BOT_TOKEN ?? '');

		const channelMembersRes = await fetch(channelMembersURL, {
			method: 'POST',
			body: channelMembersBody
		});

		const channelMembersResJSON = await channelMembersRes.json();

		if (!channelMembersResJSON.ok) {
			console.error('Failed to fetch channel members');

			return redirect(302, '/auth/failed');
		}

		if (!channelMembersResJSON['members'].includes(slack_id)) {
			return redirect(302, '/countdown');
		}
	}

	// Check Hackatime trust
	const hackatimeTrust = (
		await (
			await fetch(`https://hackatime.hackclub.com/api/v1/users/${slack_id}/trust_factor`, {
				headers: env.RACK_ATTACK_BYPASS
					? {
							RACK_ATTACK_BYPASS: env.RACK_ATTACK_BYPASS
						}
					: {}
			})
		).json()
	)['trust_level'];

	if (!hackatimeTrust) {
		console.error();
		return redirect(302, '/auth/create-hackatime-account');
		// return error(503, {
		// 	message: 'failed to fetch hackatime trust factor, please try again later'
		// });
	} else if (hackatimeTrust === 'red') {
		// Prevent login
		return redirect(302, 'https://fraud.land');
	}

	// Create user if doesn't exist
	let [databaseUser] = await db.select().from(user).where(eq(user.idvId, id)).limit(1);

	if (databaseUser?.trust === 'red') {
		// Prevent login
		return redirect(302, 'https://fraud.land');
	}

	const isSuperAdmin =
		env.SUPER_ADMIN_SLACK_ID != undefined &&
		env.SUPER_ADMIN_SLACK_ID.length > 0 &&
		slack_id === env.SUPER_ADMIN_SLACK_ID;

	const ref = event.cookies.get('ref');

	if (databaseUser) {
		// Update user (update name and profile picture and lastLoginAt on login)
		await db
			.update(user)
			.set({
				idvToken: encrypt(token),
				name: username,
				profilePicture: profilePic,
				lastLoginAt: new Date(Date.now()),
				hackatimeTrust,
				hasAdmin: isSuperAdmin ? true : undefined
			})
			.where(eq(user.idvId, id));
	} else {
		// Create user
		await db.insert(user).values({
			idvId: id,
			idvToken: encrypt(token),
			slackId: slack_id,
			name: username,
			profilePicture: profilePic,
			createdAt: new Date(Date.now()),
			lastLoginAt: new Date(Date.now()),
			hackatimeTrust,
			referralId: ref,

			hasT1Review: isSuperAdmin,
			hasT2Review: isSuperAdmin,
			hasAdmin: isSuperAdmin
		});

		[databaseUser] = await db.select().from(user).where(eq(user.idvId, id)).limit(1);

		if (!databaseUser) {
			// Something went _really_ wrong
			return error(500);
		}

		if (ref && airtableBase) {
			await airtableBase('tblwUPbRqbRBnQl7G').create({
				fldMYF9BuxKbRuSJt: first_name + ' ' + last_name, // Name
				fldXbtQyDOFpWwGBQ: databaseUser.id, // User ID
				fldkTgzCj0sz01QQM: primary_email, // Email
				fldeNiHX4OhZEDWM5: 0, // Project count
				fld1Sssrs7K69cN0i: 0, // Verified ship count
				fldaPDWM3wrIYOAEf: ref // Referral code
			});
		}
	}

	const sessionToken = generateSessionToken();
	await createSession(sessionToken, databaseUser.id);
	setSessionTokenCookie(
		event,
		sessionToken,
		new Date(Date.now() + DAY_IN_MS * SESSION_EXPIRY_DAYS)
	);

	return redirect(302, '/dashboard');
}
