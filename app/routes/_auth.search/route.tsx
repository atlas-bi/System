import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { authenticator } from '~/services/auth.server';

const normalizeMeiliHost = (host: string) => {
	if (!host) return '';
	return host.startsWith('http://') || host.startsWith('https://')
		? host
		: `http://${host}`;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	const url = new URL(request.url);
	const search = url.searchParams.get('search');

	let results;
	try {
		const rawHost = process.env.MEILISEARCH_URL || '';
		if (!rawHost) {
			return json({ results: undefined });
		}
		const { MeiliSearch } = await import('meilisearch');
		const client = new MeiliSearch({
			host: normalizeMeiliHost(rawHost),
			apiKey: process.env.MEILI_MASTER_KEY || undefined,
		});
		results = await client.index('base').search(search);
	} catch (e) {}

	return json({ results });
};
