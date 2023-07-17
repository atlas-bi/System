import { type ClassValue, clsx } from 'clsx';
import crypto from 'crypto';
import { twMerge } from 'tailwind-merge';
import invariant from 'tiny-invariant';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const algorithm = 'aes-256-ctr';

export const encrypt = (text: crypto.BinaryLike) => {
	invariant(process.env.PASS_KEY, 'PASS_KEY required for password decryption.');
	const iv = crypto.randomBytes(16);

	const cipher = crypto.createCipheriv(algorithm, process.env.PASS_KEY, iv);

	const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

	return btoa(
		JSON.stringify({
			iv: iv.toString('hex'),
			content: encrypted.toString('hex'),
		}),
	);
};

export const decrypt = (hash: string) => {
	invariant(process.env.PASS_KEY, 'PASS_KEY required for password decryption.');
	const parsedHash = JSON.parse(atob(hash));

	const decipher = crypto.createDecipheriv(
		algorithm,
		process.env.PASS_KEY,
		Buffer.from(parsedHash.iv, 'hex'),
	);

	const decrpyted = Buffer.concat([
		decipher.update(Buffer.from(parsedHash.content, 'hex')),
		decipher.final(),
	]);

	return decrpyted.toString();
};
