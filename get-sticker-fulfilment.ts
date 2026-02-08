import Cryptr from 'cryptr';

const cryptr = new Cryptr(process.env.APP_SECRET_KEY ?? '');

export function encrypt(plaintext: string) {
	return cryptr.encrypt(plaintext);
}

export function decrypt(ciphertext: string) {
	return cryptr.decrypt(ciphertext);
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: string | any[] = [];

const failed: number[] = [];

console.log(
	'First name,Last name,Address Line 1,Address Line 2,City,State,Postcode,Country,Email,Rubber Stamps'
);

for (let i = 0; i < data.length; i++) {
	try {
		const token = decrypt(data[i][2]);
		const userData = await getUserData(token);
		const { primary_email, addresses } = userData;
		const address = addresses?.find((address: { primary: boolean }) => address.primary);

		console.log(
			`${address.first_name},${address.last_name},${address.line_1},${address.line_2},${address.city},${address.state},${address.postal_code},${address.country},${primary_email},#${data[i][0]}`
		);
	} catch {
		failed.push(data[i][0]);
	}
}

console.log('\n');
console.log('Skipped:', failed);
