import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
	addDays,
	endOfDay,
	endOfToday,
	endOfWeek,
	startOfDay,
	startOfHour,
	startOfMonth,
	startOfToday,
	startOfWeek,
	startOfYear,
	subDays,
	subHours,
	subYears,
} from 'date-fns';
import { dateOptions } from '~/models/dates';
import { getCpuUsage } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';
import { dateRange } from '~/utils';

export const loader = async ({ params, request }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	const url = new URL(request.url);
	let {
		startDate,
		endDate,
	}: { startDate: Date | undefined; endDate: Date | undefined } = dateRange(
		url.searchParams.get('range'),
	);

	const monitor = await getCpuUsage({
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
			return json({ monitor: { ...monitor, startDate, endDate } });
		case 'hour':
			grouped = monitor.feeds.reduce((a, e) => {
				if (!a[startOfHour(e.createdAt).toISOString()]) {
					a[startOfHour(e.createdAt).toISOString()] = [];
				}
				a[startOfHour(e.createdAt).toISOString()].push({
					cpuLoad: e.cpuLoad,
					cpuSpeed: e.cpuSpeed,
				});
				return a;
			}, {});
			break;
		case 'day':
		default:
			grouped = monitor.feeds.reduce((a, e) => {
				if (!a[startOfDay(e.createdAt).toISOString()]) {
					a[startOfDay(e.createdAt).toISOString()] = [];
				}
				a[startOfDay(e.createdAt).toISOString()].push({
					cpuLoad: e.cpuLoad,
					cpuSpeed: e.cpuSpeed,
				});
				return a;
			}, {});
			break;
	}

	// return max value for the period.
	const feeds = Object.entries(grouped)
		.map(([k, v]) => {
			return {
				createdAt: k,
				cpuLoad: v.reduce((a, e) => Math.max(Number(a), Number(e.cpuLoad)), 0), //a + Number(e.cpuLoad), 0) / v.length,
				cpuSpeed: v.reduce(
					(a, e) => Math.max(Number(a), Number(e.cpuSpeed)),
					0,
				), // a + Number(e.cpuSpeed), 0) / v.length,
			};
		})
		.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

	return json({ monitor: { ...monitor, feeds, startDate, endDate } });
};
