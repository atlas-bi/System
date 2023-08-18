import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { getMonitorLogs } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';

export const loader = async ({ params, request }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});
	invariant(params.monitorId, 'Monitor ID is required.');
	invariant(params.databaseId, 'Database ID is required');
	const url = new URL(request.url);

	const page = Number(url.searchParams.get('page') || 0);
	const size = Number(url.searchParams.get('size') || 10);
	return json({
		data: await getMonitorLogs({
			monitorId: params.monitorId,
			databaseId: params.databaseId,
			page,
			size,
		}),
	});
};
