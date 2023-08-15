import { Link, useFetcher, useLocation } from '@remix-run/react';
import bytes from 'bytes';
import { format } from 'date-fns';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { useEffect } from 'react';
import { CpuChart } from '~/components/charts/cpuChart';
import { DoughnutChart } from '~/components/charts/driveDoughnut';
import { MemoryChart } from '~/components/charts/memoryChart';
import { Skeleton } from '~/components/ui/skeleton';
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { H3 } from '~/components/ui/typography';
import { Drive, DriveUsage, Monitor } from '~/models/monitor.server';

export const SshSystem = ({ monitor }: { monitor: Monitor }) => {
	return (
		<div className="space-y-2 flex-grow">
			<Table>
				<TableBody>
					<TableRow>
						<TableCell className="py-1 font-medium">Host</TableCell>
						<TableCell className="py-1 text-slate-700">
							{monitor.host}
						</TableCell>
					</TableRow>
					{monitor.os && (
						<TableRow>
							<TableCell className="py-1 font-medium">OS</TableCell>
							<TableCell className="py-1 text-slate-700">
								{monitor.os}
							</TableCell>
						</TableRow>
					)}
					{monitor.osVersion && (
						<TableRow>
							<TableCell className="py-1 font-medium">OS Version</TableCell>
							<TableCell className="py-1 text-slate-700">
								{monitor.osVersion}
							</TableCell>
						</TableRow>
					)}
					{monitor.lastBootTime && (
						<TableRow>
							<TableCell className="py-1 font-medium">Last Reboot</TableCell>
							<TableCell className="py-1 text-slate-700">
								{format(new Date(monitor.lastBootTime), 'MMM dd, yyyy k:mm')}
							</TableCell>
						</TableRow>
					)}
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
										, {Math.round(Number(monitor.cpuMaxSpeed) / 10) / 100} Ghz
									</>
								)}
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
};

export const SshStats = ({ monitor }: { monitor: Monitor }) => {
	const drivesFetcher = useFetcher();
	const location = useLocation();

	// if we redirect to another monitor we need to reload drives
	useEffect(() => {
		if (drivesFetcher.state === 'idle' && drivesFetcher.data == null) {
			drivesFetcher.load(`/${monitor.type}/${monitor.id}/drives`);
		}
	}, [location]);

	useEffect(() => {
		if (drivesFetcher.state === 'idle' && drivesFetcher.data == null) {
			drivesFetcher.load(`/${monitor.type}/${monitor.id}/drives`);
		}
	}, [drivesFetcher, monitor]);

	return (
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
										className={`transition-colors flex space-x-4 border rounded-md py-2 px-4 cursor-pointer hover:shadow hover:shadow-sky-200 ${
											drive.enabled ? '' : 'opacity-50 hover:opacity-100'
										}`}
									>
										<div>
											{drive.enabled ? (
												<ToggleRight size={20} className="text-slate-400" />
											) : (
												<ToggleLeft
													size={20}
													className="fill-slate-200 text-slate-400"
												/>
											)}
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
										</div>

										<div className="space-y-2 flex-grow">
											<H3 className="space-x-2">
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
													<TableRow>
														<TableCell className="py-1">
															Days Till Full
														</TableCell>
														<TableCell className="py-1">
															{drive.daysTillFull}
														</TableCell>
													</TableRow>
													<TableRow>
														<TableCell className="py-1">Growth Rate</TableCell>
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
			<TabsContent value="cpu">
				<CpuChart url={`/${monitor.type}/${monitor.id}/cpu-usage`} />
			</TabsContent>
			<TabsContent value="memory">
				<MemoryChart url={`/${monitor.type}/${monitor.id}/memory-usage`} />
			</TabsContent>
		</Tabs>
	);
};
