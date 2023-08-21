import {
	Link,
	useFetcher,
	useLocation,
	useSearchParams,
} from '@remix-run/react';
import { format, formatDistance } from 'date-fns';
import { useEffect } from 'react';
import { CpuChart } from '~/components/charts/cpuChart';
import { MemoryChart } from '~/components/charts/memoryChart';
import { PingChart } from '~/components/charts/pingChart';
import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { SqlDatabaseTable } from './sqlDatabaseTable';
import { columns } from './sqlDatabaseColumns';

export const SqlSystem = ({ monitor }: { monitor: Monitor }) => {
	return (
		<div className="space-y-2 flex-grow">
			<Table>
				<TableBody>
					{monitor.name && (
						<TableRow>
							<TableCell className="py-1 font-medium">Server Name</TableCell>
							<TableCell className="py-1 text-slate-700">
								{monitor.name}
							</TableCell>
						</TableRow>
					)}
					{(monitor.model || monitor.manufacturer) && (
						<TableRow>
							<TableCell className="py-1 font-medium">Model</TableCell>
							<TableCell className="py-1 text-slate-700">
								{monitor.manufacturer} {monitor.model}
							</TableCell>
						</TableRow>
					)}
					{monitor.version && (
						<TableRow>
							<TableCell className="py-1 font-medium">Version</TableCell>
							<TableCell className="py-1 text-slate-700">
								{monitor.version}
							</TableCell>
						</TableRow>
					)}
					{monitor.os && (
						<TableRow>
							<TableCell className="py-1 font-medium">OS</TableCell>
							<TableCell className="py-1 text-slate-700">
								{monitor.os} {monitor.osVersion}
							</TableCell>
						</TableRow>
					)}
					{monitor.lastBootTime && (
						<TableRow>
							<TableCell className="py-1 font-medium">Last Restart</TableCell>
							<TableCell className="py-1 text-slate-700">
								{formatDistance(new Date(monitor.lastBootTime), new Date())}{' '}
								ago.{' '}
								<Badge className="bg-slate-200 hover:bg-slate-300 hover:cursor-default text-slate-900">
									{format(new Date(monitor.lastBootTime), 'MMM dd, yyyy k:mm')}
								</Badge>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
};

export const SqlStats = ({ monitor }: { monitor: Monitor }) => {
	const databasesFetcher = useFetcher();
	const location = useLocation();

	// if we redirect to another monitor we need to reload databases
	useEffect(() => {
		if (databasesFetcher.state === 'idle' && databasesFetcher.data == null) {
			databasesFetcher.load(`/${monitor.type}/${monitor.id}/databases`);
		}
	}, [location]);

	const [searchParams] = useSearchParams();

	useEffect(() => {
		if (databasesFetcher.state === 'idle' && databasesFetcher.data == null) {
			databasesFetcher.load(`/${monitor.type}/${monitor.id}/databases`);
		}
	}, [databasesFetcher, monitor]);

	return (
		<Tabs
			defaultValue={`${searchParams.get('tab') || 'ping'}`}
			className="w-full"
		>
			<TabsList className="grid max-w-[400px] grid-cols-4">
				<TabsTrigger value="ping">Ping</TabsTrigger>
				<TabsTrigger value="databases">Databases</TabsTrigger>
				<TabsTrigger value="cpu">CPU</TabsTrigger>
				<TabsTrigger value="memory">Memory</TabsTrigger>
			</TabsList>
			<TabsContent value="ping">
				<PingChart url={`/${monitor.type}/${monitor.id}/ping`} />
			</TabsContent>
			<TabsContent value="databases">
				{databasesFetcher.data?.databases ? (
					<>
						<SqlDatabaseTable
							monitor={monitor}
							databases={databasesFetcher.data.databases}
							columns={columns}
						/>
					</>
				) : (
					<div className="">
						<Skeleton className="border rounded-md min-h-[200px]" />
					</div>
				)}
			</TabsContent>
			<TabsContent value="cpu">
				<CpuChart
					url={`/${monitor.type}/${monitor.id}/cpu-usage`}
					speed={false}
				/>
			</TabsContent>
			<TabsContent value="memory">
				<MemoryChart url={`/${monitor.type}/${monitor.id}/memory-usage`} />
			</TabsContent>
		</Tabs>
	);
};
