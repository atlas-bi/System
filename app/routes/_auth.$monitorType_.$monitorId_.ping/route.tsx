import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { dateOptions } from '~/models/dates';
import { getPing } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';
import { dateRange } from '~/utils';

export const loader = async ({ params, request }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	invariant(params.monitorId);
	const url = new URL(request.url);
	let {
		startDate,
		endDate,
	}: { startDate: Date | undefined; endDate: Date | undefined } = dateRange(
		url.searchParams.get('range') || 'last_24_hours',
	);

	const monitor = await getPing({
		id: params.monitorId,
		startDate,
		endDate,
	});
	if (!monitor) {
		throw new Response('Not Found', { status: 404 });
	}

	if (url.searchParams.get('range') === 'all_time') {
		startDate = undefined;
		endDate = undefined;
	}

	return json({ monitor: { ...monitor, startDate, endDate } });
};
