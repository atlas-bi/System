import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
	addDays,
	differenceInDays,
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
import { getFileUsage } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';
import { dateRange } from '~/utils';

function calcGrowth({ usage }) {
	if (!usage) {
		return { daysTillFull: -1, growthRage: -1 };
	}

	if (usage.length == 0) {
		return { daysTillFull: -1, growthRate: 0 };
	}

	const end = usage[0];
	const start = usage[usage.length - 1];

	const diffDays = differenceInDays(end.createdAt, start.createdAt) + 1;

	const usedGrowth = Number(end.used) - Number(start.used);

	if (usedGrowth === 0) {
		return { daysTillFull: -1, growthRate: 0 };
	}

	const daysTillFull =
		Math.max(Math.round((Number(end.free) * diffDays) / usedGrowth), -1) || -1;

	const growthRate = usedGrowth / diffDays;

	return { daysTillFull, growthRate };
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

	const file = await getFileUsage({ id: params.fileId, startDate, endDate });
	if (!file) {
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
	const { daysTillFull, growthRate } = calcGrowth({ usage: file.usage });

	switch (groupSize) {
		case 'minute':
			// minute is db default
			return json({
				file: { ...file, daysTillFull, growthRate, startDate, endDate },
			});
		case 'hour':
			grouped = file.usage.reduce((a, e) => {
				if (!a[startOfHour(e.createdAt).toISOString()]) {
					a[startOfHour(e.createdAt).toISOString()] = [];
				}
				a[startOfHour(e.createdAt).toISOString()].push({
					maxSize: e.maxSize,
					size: e.size,
				});
				return a;
			}, {});
			break;
		case 'day':
		default:
			grouped = file.usage.reduce((a, e) => {
				if (!a[startOfDay(e.createdAt).toISOString()]) {
					a[startOfDay(e.createdAt).toISOString()] = [];
				}
				a[startOfDay(e.createdAt).toISOString()].push({
					maxSize: e.maxSize,
					size: e.size,
				});
				return a;
			}, {});
			break;
	}

	// return max value for the period.
	const usage = Object.entries(grouped)
		.map(([k, v]) => {
			return {
				createdAt: k,
				maxSize: v.reduce((a, e) => Math.max(Number(a), Number(e.maxSize)), 0), //a + Number(e.free), 0) / v.length,
				size: v.reduce((a, e) => Math.max(Number(a), Number(e.size)), 0), //a + Number(e.used), 0) / v.length,
			};
		})
		.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

	return json({
		file: { ...file, usage, daysTillFull, growthRate, startDate, endDate },
	});
};