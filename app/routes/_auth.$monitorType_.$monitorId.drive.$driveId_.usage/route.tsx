import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { differenceInDays, startOfDay, startOfHour } from 'date-fns';
import invariant from 'tiny-invariant';
import { dateOptions } from '~/models/dates';
import { getDriveUsage } from '~/models/drive.server';
import { authenticator } from '~/services/auth.server';
import { dateRange } from '~/utils';

function calcGrowth({
	usage,
}: {
	usage: { createdAt: Date; used: string | null; free: string | null }[];
}) {
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
		url.searchParams.get('range') || 'last_24_hours',
	);

	invariant(params.driveId);
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
	const { daysTillFull, growthRate } = calcGrowth({ usage: drive.usage });

	type aType = {
		[key: string]: {
			free: string | null;
			used: string | null;
		}[];
	};

	type eType = {
		free: string | null;
		used: string | null;
		createdAt: Date;
	};

	switch (groupSize) {
		case 'minute':
			// minute is db default
			return json({
				drive: { ...drive, daysTillFull, growthRate, startDate, endDate },
			});
		case 'hour':
			grouped = drive.usage.reduce((a: aType, e: eType) => {
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
			grouped = drive.usage.reduce((a: aType, e: eType) => {
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

	// return max value for the period.
	const usage = Object.entries(grouped)
		.map(([k, v]) => {
			type vType = { free: string | null; used: string | null }[];
			return {
				createdAt: k,
				free: Math.min(...(v as vType).map((x) => Number(x.free))),
				used: Math.max(...(v as vType).map((x) => Number(x.used))),
			};
		})
		.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

	return json({
		drive: { ...drive, usage, daysTillFull, growthRate, startDate, endDate },
	});
};
