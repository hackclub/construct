import Cryptr from 'cryptr';

const cryptr = new Cryptr(process.env.APP_SECRET_KEY ?? '');

export function encrypt(plaintext: string) {
	return cryptr.encrypt(plaintext);
}

export function decrypt(ciphertext: string) {
	return cryptr.decrypt(ciphertext);
}

const tokens = [''];

export async function getUserData(token: string) {
	const userDataURL = new URL(`https://auth.hackclub.com/api/v1/me`);
	const userDataRes = await fetch(userDataURL, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!userDataRes.ok) {
		throw new Error('Failed to fetch user data');
	}

	const userDataJSON = await userDataRes.json();

	return userDataJSON.identity!;
}

const countries: Record<string, number> = {};

for (let i = 0; i < tokens.length; i++) {
	try {
		const token = decrypt(tokens[i]);
		const userData = await getUserData(token);
		const { addresses } = userData;
		const address = addresses?.find((address: { primary: boolean }) => address.primary);
		console.log('Address', i + '/' + tokens.length + ':', address.country);

		countries[address.country as string] = (countries[address.country as string] ?? 0) + 1;
	} catch {
		console.warn('Failed: user ' + i);
	}
}

console.log('\n');
console.log(countries);
