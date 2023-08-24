import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { startOfDay, startOfHour } from 'date-fns';
import invariant from 'tiny-invariant';
import { dateOptions } from '~/models/dates';
import { getMemoryUsage } from '~/models/monitor.server';
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

	const monitor = await getMemoryUsage({
		id: params.monitorId,
		startDate,
		endDate,
	});
	if (!monitor) {
		throw new Response('Not Found', { status: 404 });
	}

	const groupSize = dateOptions.filter(
		(x) => x.value == url.searchParams.get('range'),
	)?.[0]?.unit;

	if (url.searchParams.get('range') === 'all_time') {
		startDate = undefined;
		endDate = undefined;
	}

	let grouped = {};

	switch (groupSize) {
		case 'minute':
			// minute is db default
			return json({
				monitor: {
					...monitor,
					feeds: monitor.feeds.map((x) => ({
						createdAt: x.createdAt,
						used: Number(x.memoryTotal) - Number(x.memoryFree),
						free: Number(x.memoryFree),
					})),
					startDate,
					endDate,
				},
			});
		case 'hour':
			grouped = monitor.feeds.reduce(
				(
					a: {
						[key: string]: {
							memoryTotal: string | null;
							memoryFree: string | null;
						}[];
					},

					e: {
						memoryTotal: string | null;
						memoryFree: string | null;
						createdAt: Date;
					},
				) => {
					if (!a[startOfHour(e.createdAt).toISOString()]) {
						a[startOfHour(e.createdAt).toISOString()] = [];
					}
					a[startOfHour(e.createdAt).toISOString()].push({
						memoryTotal: e.memoryTotal,
						memoryFree: e.memoryFree,
					});
					return a;
				},
				{},
			);
			break;
		case 'day':
		default:
			grouped = monitor.feeds.reduce(
				(
					a: {
						[key: string]: {
							memoryTotal: string | null;
							memoryFree: string | null;
						}[];
					},

					e: {
						memoryTotal: string | null;
						memoryFree: string | null;
						createdAt: Date;
					},
				) => {
					if (!a[startOfDay(e.createdAt).toISOString()]) {
						a[startOfDay(e.createdAt).toISOString()] = [];
					}
					a[startOfDay(e.createdAt).toISOString()].push({
						memoryTotal: e.memoryTotal,
						memoryFree: e.memoryFree,
					});
					return a;
				},
				{},
			);
			break;
	}

	// return max value for the period.
	const feeds = Object.entries(grouped)
		.map(([k, v]) => {
			type vType = {
				memoryTotal: string | null;
				memoryFree: string | null;
				createdAt: string;
			}[];
			return {
				createdAt: k,
				used: Math.max(
					...(v as vType).map(
						(x) => Number(x.memoryTotal) - Number(x.memoryFree),
					),
				),
				free: Math.min(...(v as vType).map((x) => Number(x.memoryFree))),
			};
		})
		.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

	return json({ monitor: { ...monitor, feeds, startDate, endDate } });
};
