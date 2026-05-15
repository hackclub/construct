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
const data: string | any[] = [
	
];

const failed: number[][] = [];

console.log(
	'Email,Slack ID,Loops - Special - setFullName,Loops - Special - setFullAddress,Loops - birthday,Loops - constructSignUpAt,Loops - constructHoursSubmitted'
);

for (let i = 0; i < data.length; i++) {
	try {
		const token = decrypt(data[i][2]);
		const userData = await getUserData(token);
		const { primary_email, first_name, last_name, slack_id, birthday, addresses } = userData;
		const address = addresses?.find((address: { primary: boolean }) => address.primary);

		const addressStr = address
			? `${address.line_1 ?? ''},${address.line_2 ?? ''},${address.city ?? ''},${address.state ?? ''},${address.postal_code ?? ''},${address.country ?? ''}`
			: '';

		console.log(
			`"${primary_email!}","${slack_id!}","${first_name ?? ''} ${last_name ?? ''}","${addressStr}",${birthday!},${data[i][3]},${data[i][4]}`
		);
	} catch {
		failed.push([data[i][0], data[i][1]]);
	}
}

console.log('\n');
console.log('Skipped:', failed);
