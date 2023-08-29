import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getDriveNotifications } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';
import { Link, useFetcher, useLoaderData, useParams } from '@remix-run/react';
import { DriveChart } from '~/components/charts/driveChart';
import { H1 } from '~/components/ui/typography';
import { Activity, AlertTriangle, MoveLeft, Settings } from 'lucide-react';
import { BellRing } from 'lucide-react';
import { MoveRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';
import bytes from 'bytes';
import { useEffect, useState } from 'react';

import { LogTable } from '~/components/logTable/table';
import { Button } from '~/components/ui/button';
import Drive from '~/components/driveForms/base';
import { Badge } from '~/components/ui/badge';
import { PingStat } from '../_auth.$monitorType_.$monitorId._index/responseTime';

export const loader = async ({ params, request }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	const driveLoad = await getDriveNotifications({ id: params.driveId });

	return json({ driveLoad });
};

export default function Index() {
	const { driveLoad } = useLoaderData<typeof loader>();
	let { monitorId, monitorType } = useParams();
	const usageFetcher = useFetcher();
	const dataFetcher = useFetcher();

	const [drive, setDrive] = useState(driveLoad);

	// Get fresh header data every 30 seconds.
	useEffect(() => setDrive(driveLoad), [driveLoad]);

	useEffect(() => {
		const interval = setInterval(() => {
			if (document.visibilityState === 'visible') {
				dataFetcher.load(window.location.pathname);
			}
		}, 30 * 1000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (dataFetcher.data?.driveLoad) {
			setDrive(dataFetcher.data.driveLoad);
		}
	}, [dataFetcher.data]);

	useEffect(() => {
		if (drive && usageFetcher.state === 'idle' && usageFetcher.data == null) {
			usageFetcher.load(
				`/${drive.monitor.type}/${drive.monitor.id}/drive/${drive.id}/usage`,
			);
		}
	}, [usageFetcher]);

	if (!drive) {
		return <></>;
	}

	return (
		<>
			<div className="flex justify-between pb-4">
				<Link
					to={`/${monitorType}/${monitorId}`}
					className="flex content-center space-x-2 text-slate-600"
					prefetch="intent"
				>
					<MoveLeft size={16} className="my-auto" />
					<span className="my-auto">
						Back to <strong>{drive.monitor.title}</strong>
					</span>
				</Link>
				<Badge variant="outline" className="border-orange-600">
					Drive
				</Badge>
				<div className="flex divide-x">
					<Drive drive={drive}>
						<Button variant="link" className="text-slate-700 h-6 ">
							<Settings size={16} />
						</Button>
					</Drive>
					<Link
						to={`/${monitorType}/${monitorId}/drive/${drive.id}/notifications`}
						className="flex content-center space-x-2 pl-3 text-slate-600"
						prefetch="intent"
					>
						<BellRing size={16} className="my-auto" />
						<span className="my-auto">Manage Notifications</span>
						<MoveRight size={16} className="my-auto" />
					</Link>
				</div>
			</div>

			<div className="flex flex-wrap justify-between">
				<H1 className="space-x-2 flex">
					{drive.enabled === false ? (
						<span className="!text-slate-400">(Disabled)</span>
					) : drive.hasError ? (
						<AlertTriangle className="text-red-500 my-auto" size={18} />
					) : (
						<Activity className="text-emerald-600 my-auto" size={18} />
					)}

					{drive.title ? (
						<>
							<span>{drive.title}</span>
							<span>({drive.root})</span>
						</>
					) : (
						<>
							{drive.root}
							{drive.location}
						</>
					)}
				</H1>
				<PingStat
					url={`/${monitorType}/${monitorId}/drive/${drive.id}/ping-latest`}
				/>
			</div>
			<div className="space-y-4 pb-4">
				<div className="text-muted-foreground">{drive.description}</div>
				<div className="space-y-2 flex-grow">
					<Table>
						<TableBody>
							<TableRow>
								<TableCell className="py-1 font-medium">Size</TableCell>
								<TableCell className="py-1 text-slate-700">
									{' '}
									{bytes(Number(drive.size))}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="py-1">Used</TableCell>
								<TableCell className="py-1">
									{' '}
									{bytes(Number(drive.usage?.[0]?.used)) || '-1'}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="py-1">Free</TableCell>
								<TableCell className="py-1">
									{' '}
									{bytes(Number(drive.usage?.[0]?.free)) || '-1'}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>

				<DriveChart
					url={`/${drive.monitor.type}/${drive.monitor.id}/drive/${drive.id}/usage`}
				/>
				<LogTable url={`/${monitorType}/${monitorId}/drive/${drive.id}/logs`} />
			</div>
		</>
	);
}
