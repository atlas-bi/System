import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { startOfDay, startOfHour } from 'date-fns';
import invariant from 'tiny-invariant';
import { dateOptions } from '~/models/dates';
import { getDatabaseUsage } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';
import { dateRange } from '~/utils';

export const loader = async ({ params, request }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});
	invariant(params.databaseId);
	const url = new URL(request.url);
	let {
		startDate,
		endDate,
	}: { startDate: Date | undefined; endDate: Date | undefined } = dateRange(
		url.searchParams.get('range'),
	);

	const database = await getDatabaseUsage({
		id: params.databaseId,
		startDate,
		endDate,
	});
	if (!database) {
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
	type aType = {
		[key: string]: {
			memory: string | null;
		}[];
	};

	type eType = {
		memory: string | null;
		createdAt: Date;
	};
	switch (groupSize) {
		case 'minute':
			// minute is db default
			return json({
				database: { ...database, startDate, endDate },
			});
		case 'hour':
			grouped = database.usage.reduce((a: aType, e: eType) => {
				if (!a[startOfHour(e.createdAt).toISOString()]) {
					a[startOfHour(e.createdAt).toISOString()] = [];
				}
				a[startOfHour(e.createdAt).toISOString()].push({
					memory: e.memory,
				});
				return a;
			}, {});
			break;
		case 'day':
		default:
			grouped = database.usage.reduce((a: aType, e: eType) => {
				if (!a[startOfDay(e.createdAt).toISOString()]) {
					a[startOfDay(e.createdAt).toISOString()] = [];
				}
				a[startOfDay(e.createdAt).toISOString()].push({
					memory: e.memory,
				});
				return a;
			}, {});
			break;
	}

	// return max value for the period.
	const usage = Object.entries(grouped)
		.map(([k, v]) => {
			type vType = { memory: string | null }[];
			return {
				createdAt: k,
				memory: Math.max(...(v as vType).map((x) => Number(x.memory))),
			};
		})
		.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

	return json({
		database: { ...database, usage, startDate, endDate },
	});
};
