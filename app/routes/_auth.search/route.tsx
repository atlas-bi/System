import { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { MeiliSearch } from 'meilisearch';
import { authenticator } from '~/services/auth.server';

const client = new MeiliSearch({
	host: process.env.MEILISEARCH_URL || 'locathost:7700',
	apiKey: process.env.MEILI_MASTER_KEY,
});

export const loader = async ({ request }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	const url = new URL(request.url);
	const search = url.searchParams.get('search');

	let results;
	try {
		results = await client.index('base').search(search);
	} catch (e) {}

	return json({ results });
};
