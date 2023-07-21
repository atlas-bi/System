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
import { getDriveUsage } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';

export function dateRange(key: string) {
	const today = new Date();
	switch (key) {
		case 'today':
			return { startDate: startOfToday(), endDate: endOfToday() };
			break;
		case 'last_24_hours':
		default:
			return { startDate: subHours(today, 24), endDate: today };
			break;
		case 'yesterday':
			return {
				startDate: startOfDay(subDays(today, 1)),
				endDate: endOfDay(subDays(today, 1)),
			};
			break;
		case 'this_week':
			return { startDate: startOfWeek(today), endDate: endOfWeek(today) };
			break;
		case 'last_7_days':
			return { startDate: subDays(today, 7), endDate: endOfToday() };
			break;
		case 'this_month':
			return { startDate: startOfMonth(today), endDate: endOfToday() };
			break;
		case 'last_30_days':
			return { startDate: subDays(today, 30), endDate: endOfToday() };
			break;
		case 'last_90_days':
			return { startDate: subDays(today, 90), endDate: endOfToday() };
			break;
		case 'this_year':
			return { startDate: startOfYear(today), endDate: endOfToday() };
			break;
		case 'all_time':
			return { startDate: subYears(today, 50), endDate: endOfToday() };
			break;
	}
}

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

	const drive = await getDriveUsage({ id: params.driveId, startDate, endDate });
	if (!drive) {
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
		case 'hour':
			grouped = drive.usage.reduce((a, e) => {
				if (!a[startOfHour(e.createdAt).toISOString()]) {
					a[startOfHour(e.createdAt).toISOString()] = [];
				}
				a[startOfHour(e.createdAt).toISOString()].push({
					free: e.free,
					used: e.used,
				});
				return a;
			}, {});
			break;
		case 'day':
		default:
			grouped = drive.usage.reduce((a, e) => {
				if (!a[startOfDay(e.createdAt).toISOString()]) {
					a[startOfDay(e.createdAt).toISOString()] = [];
				}
				a[startOfDay(e.createdAt).toISOString()].push({
					free: e.free,
					used: e.used,
				});
				return a;
			}, {});
			break;
	}

	const usage = Object.entries(grouped)
		.map(([k, v]) => {
			return {
				createdAt: k,
				free: v.reduce((a, e) => a + Number(e.free), 0) / v.length,
				used: v.reduce((a, e) => a + Number(e.used), 0) / v.length,
			};
		})
		.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

	return json({ drive: { ...drive, usage, startDate, endDate } });
};
