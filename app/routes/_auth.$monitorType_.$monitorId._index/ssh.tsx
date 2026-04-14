import { useFetcher, useLocation } from '@remix-run/react';
import bytes from 'bytes';
import { format, formatDistance } from 'date-fns';
import { useEffect } from 'react';
import { CpuChart } from '~/components/charts/cpuChart';
import { MemoryChart } from '~/components/charts/memoryChart';
import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { MiniDrive } from './drive';

type MonitorLike = {
	type: string;
	id: string;
	host?: string | null;
	os?: string | null;
	osVersion?: string | null;
	lastBootTime?: string | Date | null;
	cpuModel?: string | null;
	cpuCores?: number | string | null;
	cpuProcessors?: number | string | null;
	cpuMaxSpeed?: number | string | null;
};

export const SshSystem = ({ monitor }: { monitor: MonitorLike }) => {
	const feedFetcher = useFetcher<{ feed?: { memoryTotal?: string | null } }>();
	const location = useLocation();
	// if we redirect to another monitor we need to reload drives
	useEffect(() => {
		if (feedFetcher.state === 'idle' && feedFetcher.data == null) {
			feedFetcher.load(`/${monitor.type}/${monitor.id}/feed-latest`);
		}
	}, [location]);

	useEffect(() => {
		if (feedFetcher.state === 'idle' && feedFetcher.data == null) {
			feedFetcher.load(`/${monitor.type}/${monitor.id}/feed-latest`);
		}
	}, [feedFetcher.state, feedFetcher.data, monitor.type, monitor.id]);
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
								{formatDistance(new Date(monitor.lastBootTime), new Date())}{' '}
								ago.{' '}
								<Badge className="bg-slate-200 text-slate-900">
									{format(new Date(monitor.lastBootTime), 'MMM dd, yyyy k:mm')}
								</Badge>
							</TableCell>
						</TableRow>
					)}
					<TableRow>
						<TableCell className="py-1 font-medium">Memory</TableCell>
						<TableCell className="py-1 text-slate-700">
							{feedFetcher.data ? (
								bytes(Number(feedFetcher.data?.feed?.memoryTotal || 0))
							) : (
								<Skeleton className="h-3 w-full max-w-[60px] rounded-sm" />
							)}
						</TableCell>
					</TableRow>
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

export const SshStats = ({ monitor }: { monitor: MonitorLike }) => {
	const drivesFetcher = useFetcher<{ drives?: any[] }>();
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
	}, [drivesFetcher.state, drivesFetcher.data, monitor.type, monitor.id]);

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
							{drivesFetcher.data.drives.map((drive) => (
								<MiniDrive monitor={monitor as any} drive={drive as any} />
							))}
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
