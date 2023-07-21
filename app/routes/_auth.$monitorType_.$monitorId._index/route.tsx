import bytes from 'bytes';
import { useEffect } from 'react';
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';
import { DoughnutChart } from '~/components/charts/driveDoughnut';
import { H1, H3 } from '~/components/ui/typography';
import { LoaderArgs, redirect } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getMonitorPublic } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';

import { Link, useFetcher, useLoaderData } from '@remix-run/react';
import { BellRing, MoveLeft, MoveRight } from 'lucide-react';
import { Skeleton } from '~/components/ui/skeleton';
import invariant from 'tiny-invariant';

import type { Drive, DriveUsage, MonitorLogs } from '~/models/monitor.server';
import { LogTable } from '~/components/logTable/table';
import { monitorTypes } from '~/models/monitor';
import { format } from 'date-fns';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

export const loader = async ({ params, request }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	invariant(params.monitorId, 'Monitor ID is required.');
	invariant(params.monitorType, 'Monitor Type is required.');

	if (monitorTypes.filter((x) => x.value === params.monitorType).length === 0) {
		return redirect('/');
	}
	const monitor = await getMonitorPublic({ id: params.monitorId });
	invariant(monitor, 'Monitor not found.');
	return json({
		monitor,
	});
};

export default function Index() {
	const { monitor } = useLoaderData<typeof loader>();
	const drivesFetcher = useFetcher();

	useEffect(() => {
		if (drivesFetcher.state === 'idle' && drivesFetcher.data == null) {
			drivesFetcher.load(`/${monitor.type}/${monitor.id}/drives`);
		}
	}, [drivesFetcher, monitor]);

	return (
		<>
			<div className="flex justify-between">
				<Link
					to={`/${monitor.type}`}
					className="flex content-center space-x-2 pb-4 text-slate-700"
					prefetch="intent"
				>
					<MoveLeft size={16} className="my-auto" />
					<span className="my-auto">Back to Monitors</span>
				</Link>
				<Link
					to={`/${monitor.type}/${monitor.id}/notifications`}
					className="flex content-center space-x-2 pb-4 text-slate-600"
					prefetch="intent"
				>
					<BellRing size={16} className="my-auto" />
					<span className="my-auto">Manage Notifications</span>
					<MoveRight size={16} className="my-auto" />
				</Link>
			</div>
			<H1>{monitor.title}</H1>
			<div className="space-y-4 pb-4">
				<div className="text-muted-foreground">
					{monitor.host}
					{monitor.os && (
						<>
							{monitor.host && <> · </>}
							{monitor.os}
						</>
					)}
					{monitor.osVersion && (
						<>
							{(monitor.host || monitor.os) && <> · </>}
							{monitor.osVersion}
						</>
					)}
				</div>

				<div className="space-y-2 flex-grow">
					<Table>
						<TableBody>
							<TableRow>
								<TableCell className="py-1 font-medium">Last Reboot</TableCell>
								<TableCell className="py-1 text-slate-700">
									{monitor.lastBootTime && (
										<>
											{format(
												new Date(monitor.lastBootTime),
												'MMM dd, yyyy k:mm',
											)}
										</>
									)}
								</TableCell>
							</TableRow>
							{monitor.feeds && (
								<TableRow>
									<TableCell className="py-1 font-medium">Memory</TableCell>
									<TableCell className="py-1 text-slate-700">
										{bytes(Number(monitor.feeds?.[0]?.memoryTotal || 0))}
									</TableCell>
								</TableRow>
							)}
							{monitor.cpuModel && (
								<TableRow>
									<TableCell className="py-1 font-medium">CPU</TableCell>
									<TableCell className="py-1 text-slate-700">
										{monitor.cpuModel}
										{monitor.cpuCores && <>, {monitor.cpuCores} cores</>}
										{monitor.cpuProcessors && (
											<>, {monitor.cpuProcessors} processors</>
										)}
										{monitor.cpuMaxSpeed && (
											<>
												, {Math.round(Number(monitor.cpuMaxSpeed) / 10) / 100}{' '}
												Ghz
											</>
										)}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				<Tabs defaultValue="storage" className="w-full">
					<TabsList className="grid max-w-[400px] grid-cols-3">
						<TabsTrigger value="storage">Storage</TabsTrigger>
						<TabsTrigger value="cpu">CPU</TabsTrigger>
						<TabsTrigger value="memory">Memory</TabsTrigger>
					</TabsList>
					<TabsContent value="storage">
						{drivesFetcher.data?.drives ? (
							<>
								<div className="grid gap-4 py-4 grid-cols-2">
									{drivesFetcher.data.drives.map(
										(drive: Drive & { usage: DriveUsage[] }) => (
											<Link
												to={`/${monitor.type}/${monitor.id}/drive/${drive.id}`}
												prefetch="intent"
												key={drive.id}
												className="flex space-x-4 border rounded-md py-2 px-4 cursor-pointer hover:shadow hover:shadow-sky-200"
											>
												<DoughnutChart
													className="w-36 h-36"
													data={{
														labels: [
															`Used ${bytes(Number(drive.usage?.[0]?.used))}`,
															`Free ${bytes(Number(drive.usage?.[0]?.free))}`,
														],
														datasets: [
															{
																label: 'Drive Usage',
																data: [
																	Number(drive.usage?.[0]?.used),
																	Number(drive.usage?.[0]?.used) +
																		Number(drive.usage?.[0]?.free) ==
																	0
																		? 100
																		: Number(drive.usage?.[0]?.free),
																],
															},
														],
													}}
												/>

												<div className="space-y-2 flex-grow">
													<H3>
														{drive.name}:\{drive.location}
													</H3>

													<Table>
														<TableBody>
															<TableRow>
																<TableCell className="py-1 font-medium">
																	Size
																</TableCell>
																<TableCell className="py-1 text-slate-700">
																	{' '}
																	{bytes(Number(drive.size))}
																</TableCell>
															</TableRow>
															<TableRow>
																<TableCell className="py-1">Used</TableCell>
																<TableCell className="py-1">
																	{' '}
																	{bytes(Number(drive.usage?.[0]?.used)) ||
																		'-1'}
																</TableCell>
															</TableRow>
															<TableRow>
																<TableCell className="py-1">Free</TableCell>
																<TableCell className="py-1">
																	{' '}
																	{bytes(Number(drive.usage?.[0]?.free)) ||
																		'-1'}
																</TableCell>
															</TableRow>
															<TableRow>
																<TableCell className="py-1">
																	Days Till Full
																</TableCell>
																<TableCell className="py-1">
																	{drive.daysTillFull}
																</TableCell>
															</TableRow>
															<TableRow>
																<TableCell className="py-1">
																	Growth Rate
																</TableCell>
																<TableCell className="py-1">
																	{bytes(Number(drive.growthRate))} / day
																</TableCell>
															</TableRow>
														</TableBody>
													</Table>
												</div>
											</Link>
										),
									)}
								</div>
							</>
						) : (
							<div className="grid gap-4 py-4 grid-cols-2">
								<Skeleton className="border rounded-md min-h-[200px]" />
								<Skeleton className="border rounded-md min-h-[200px]" />
							</div>
						)}
					</TabsContent>
					<TabsContent value="cpu"></TabsContent>
					<TabsContent value="memory"></TabsContent>
				</Tabs>

				<LogTable url={`/${monitor.type}/${monitor.id}/logs`} />
			</div>
		</>
	);
}
