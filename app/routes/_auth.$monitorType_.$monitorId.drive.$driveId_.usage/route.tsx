import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { differenceInDays, startOfDay, startOfHour } from 'date-fns';
import { dateOptions } from '~/models/dates';
import { getDriveUsage } from '~/models/monitor.server';
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

	switch (groupSize) {
		case 'minute':
			// minute is db default
			return json({
				drive: { ...drive, daysTillFull, growthRate, startDate, endDate },
			});
		case 'hour':
			grouped = drive.usage.reduce(
				(
					a: {
						[key: string]: {
							free: string | null;
							used: string | null;
						}[];
					},

					e: {
						free: string | null;
						used: string | null;
						createdAt: Date;
					},
				) => {
					if (!a[startOfHour(e.createdAt).toISOString()]) {
						a[startOfHour(e.createdAt).toISOString()] = [];
					}
					a[startOfHour(e.createdAt).toISOString()].push({
						free: e.free,
						used: e.used,
					});
					return a;
				},
				{},
			);
			break;
		case 'day':
		default:
			grouped = drive.usage.reduce(
				(
					a: {
						[key: string]: {
							free: string | null;
							used: string | null;
						}[];
					},

					e: {
						free: string | null;
						used: string | null;
						createdAt: Date;
					},
				) => {
					if (!a[startOfDay(e.createdAt).toISOString()]) {
						a[startOfDay(e.createdAt).toISOString()] = [];
					}
					a[startOfDay(e.createdAt).toISOString()].push({
						free: e.free,
						used: e.used,
					});
					return a;
				},
				{},
			);
			break;
	}

	// return max value for the period.
	const usage = Object.entries(grouped)
		.map(([k, v]) => {
			return {
				createdAt: k,
				free: (v as { free: string | null }[]).reduce(
					(a: number, e: { free: string | null }) =>
						Math.max(Number(a), Number(e.free)),
					0,
				),
				used: (v as { used: string | null }[]).reduce(
					(a: number, e: { used: string | null }) =>
						Math.max(Number(a), Number(e.used)),
					0,
				),
			};
		})
		.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

	return json({
		drive: { ...drive, usage, daysTillFull, growthRate, startDate, endDate },
	});
};
