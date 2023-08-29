import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { getDatabaseLatestFeeds } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';

export const loader = async ({ params, request }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	invariant(params.databaseId, 'Database ID is required.');
	const feeds = await getDatabaseLatestFeeds({
		id: params.databaseId,
	});

	return json({ feeds });
};
