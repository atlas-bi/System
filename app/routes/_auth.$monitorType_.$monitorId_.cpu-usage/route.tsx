import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { startOfDay, startOfHour } from 'date-fns';
import invariant from 'tiny-invariant';
import { dateOptions } from '~/models/dates';
import { getCpuUsage } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';
import { dateRange } from '~/utils';

type dataType = {
	createdAt: Date;
	cpuLoad?: string | null;
	cpuSpeed?: string | null;
	load?: string | null;
	speed?: string | null;
};

type aType = {
	[key: string]: {
		cpuLoad: string | null;
		cpuSpeed: string | null;
	}[];
};

function reducer(unit: string, data: dataType[]) {
	switch (unit) {
		case 'hour':
			return data.reduce(
				(
					a: aType,

					e: dataType,
				) => {
					if (!a[startOfHour(e.createdAt).toISOString()]) {
						a[startOfHour(e.createdAt).toISOString()] = [];
					}
					a[startOfHour(e.createdAt).toISOString()].push({
						cpuLoad: e.cpuLoad || e.load || null,
						cpuSpeed: e.cpuSpeed || e.speed || null,
					});
					return a;
				},
				{},
			);
		case 'day':
		default:
			return data.reduce(
				(
					a: aType,

					e: dataType,
				) => {
					if (!a[startOfDay(e.createdAt).toISOString()]) {
						a[startOfDay(e.createdAt).toISOString()] = [];
					}
					a[startOfDay(e.createdAt).toISOString()].push({
						cpuLoad: e.cpuLoad || e.load || null,
						cpuSpeed: e.cpuSpeed || e.speed || null,
					});
					return a;
				},
				{},
			);
	}
}

function grouper(group: {
	[key: string]: {
		cpuLoad: string | null;
		cpuSpeed: string | null;
	}[];
}) {
	return Object.entries(group)
		.map(([k, v]) => {
			type vType = { cpuLoad: string | null; cpuSpeed: string | null }[];
			return {
				createdAt: k,
				cpuLoad: Math.max(...(v as vType).map((x) => Number(x.cpuLoad))),
				cpuSpeed: Math.max(...(v as vType).map((x) => Number(x.cpuSpeed))),
			};
		})
		.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

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

	if (groupSize === 'minute') {
		return json({
			monitor: {
				...monitor,
				cpus: monitor.cpus.map((cpu) => ({
					...cpu,
					usage: cpu.usage.map((u) => ({
						id: u.id,
						cpuLoad: u.load,
						cpuSpeed: u.speed,
						createdAt: u.createdAt,
					})),
				})),
				startDate,
				endDate,
			},
		});
	}

	// return max value for the period.
	const feeds = grouper(reducer(groupSize, monitor.feeds));

	const cpus = monitor.cpus.map((x) => ({
		...x,
		usage: grouper(reducer(groupSize, x.usage)),
	}));

	return json({ monitor: { ...monitor, feeds, cpus, startDate, endDate } });
};
