import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { differenceInDays, startOfDay, startOfHour } from 'date-fns';
import invariant from 'tiny-invariant';
import { dateOptions } from '~/models/dates';
import {
	DatabaseFile,
	DatabaseFileUsage,
	getFileUsage,
} from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';
import { dateRange } from '~/utils';

function calcGrowth({ usage }: { usage: DatabaseFileUsage[] }) {
	if (!usage) {
		return { daysTillFull: -1, growthRage: -1 };
	}

	if (usage.length == 0) {
		return { daysTillFull: -1, growthRate: 0 };
	}

	const end = usage[0];
	const start = usage[usage.length - 1];

	const diffDays = differenceInDays(end.createdAt, start.createdAt) + 1;

	const usedGrowth = Number(end.usedSize) - Number(start.usedSize);

	if (usedGrowth === 0) {
		return { daysTillFull: -1, growthRate: 0 };
	}

	const daysTillFull =
		Math.max(
			Math.round(
				((Number(end.currentSize) - Number(end.usedSize)) * diffDays) /
					usedGrowth,
			),
			-1,
		) || -1;

	const growthRate = usedGrowth / diffDays;

	return { daysTillFull, growthRate };
}

export const loader = async ({ params, request }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	invariant(params.fileId);

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
				file: {
					...file,
					usage: file.usage.map((x) => ({
						createdAt: x.createdAt,
						maxSize: Number(x.maxSize),
						free: Number(x.currentSize) - Number(x.usedSize),
						used: Number(x.usedSize),
					})),
					daysTillFull,
					growthRate,
					startDate,
					endDate,
				},
			});
		case 'hour':
			grouped = file.usage.reduce((a, e) => {
				if (!a[startOfHour(e.createdAt).toISOString()]) {
					a[startOfHour(e.createdAt).toISOString()] = [];
				}
				a[startOfHour(e.createdAt).toISOString()].push({
					maxSize: e.maxSize,
					currentSize: e.currentSize,
					usedSize: e.usedSize,
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
					currentSize: e.currentSize,
					usedSize: e.usedSize,
				});
				return a;
			}, {});
			break;
	}

	// return max value for the period.
	const usage = Object.entries(grouped)
		.map(([k, v]) => {
			type vType = {
				maxSize: string | null;
				currentSize: string | null;
				usedSize: string | null;
			}[];
			return {
				createdAt: k,
				maxSize: Math.max(...(v as vType).map((x) => Number(x.maxSize))),
				// free
				free: Math.min(
					...(v as vType).map(
						(x) => Number(x.currentSize) - Number(x.usedSize),
					),
				),
				// used
				used: Math.max(...(v as vType).map((x) => Number(x.usedSize))),
			};
		})
		.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

	return json({
		file: { ...file, usage, daysTillFull, growthRate, startDate, endDate },
	});
};
