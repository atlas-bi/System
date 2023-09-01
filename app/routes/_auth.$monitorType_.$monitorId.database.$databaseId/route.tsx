import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getDatabaseNotifications } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';
import {
	Link,
	useFetcher,
	useLoaderData,
	useParams,
	useSearchParams,
} from '@remix-run/react';
import { H1, H3 } from '~/components/ui/typography';
import { MoveLeft, Settings } from 'lucide-react';
import { BellRing } from 'lucide-react';
import { MoveRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';
import bytes from 'bytes';
import { useEffect, useState } from 'react';

import { LogTable } from '~/components/logTable/table';
import { Button } from '~/components/ui/button';
import Database from '~/components/databaseForms/base';
import { format, formatDistance } from 'date-fns';
import { Badge } from '~/components/ui/badge';
import { FilesTable } from './filesTable';
import { columns } from './filesTableColumns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { MemoryChart } from '~/components/charts/databaseMemoryChart';
import invariant from 'tiny-invariant';

export const loader = async ({ params, request }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	invariant(params.databaseId);

	const databaseLoad = await getDatabaseNotifications({
		id: params.databaseId,
	});

	invariant(databaseLoad);

	return json({ databaseLoad });
};

export default function Index() {
	const { databaseLoad } = useLoaderData<typeof loader>();
	let { monitorId, monitorType } = useParams();
	const usageFetcher = useFetcher();
	const dataFetcher = useFetcher();

	const [database, setDatabase] = useState(databaseLoad);

	// Get fresh header data every 30 seconds.
	useEffect(() => setDatabase(databaseLoad), [databaseLoad]);

	useEffect(() => {
		const interval = setInterval(() => {
			if (document.visibilityState === 'visible') {
				dataFetcher.load(window.location.pathname);
			}
		}, 30 * 1000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (dataFetcher.data?.databaseLoad) {
			setDatabase(dataFetcher.data.databaseLoad);
		}
	}, [dataFetcher.data]);

	useEffect(() => {
		if (usageFetcher.state === 'idle' && usageFetcher.data == null) {
			usageFetcher.load(
				`/${monitorType}/${monitorId}/database/${database.id}/usage`,
			);
		}
	}, [usageFetcher]);
	const [searchParams] = useSearchParams();

	return (
		<>
			<div className="flex justify-between pb-4">
				<Link
					to={`/${monitorType}/${monitorId}?tab=databases`}
					className="flex content-center space-x-2 text-slate-600"
					prefetch="intent"
				>
					<MoveLeft size={16} className="my-auto" />
					<span className="my-auto">
						Back to <strong>{database.monitor.title}</strong>
					</span>
				</Link>
				<Badge variant="outline" className="border-orange-600">
					Database
				</Badge>
				<div className="flex divide-x">
					<Database database={database} setter={setDatabase}>
						<Button variant="link" className="text-slate-700 h-6 ">
							<Settings size={16} />
						</Button>
					</Database>
					{/*<Link
						to={`/${monitorType}/${monitorId}/database/${database.id}/notifications`}
						className="flex content-center space-x-2 pl-3 text-slate-600"
						prefetch="intent"
					>
						<BellRing size={16} className="my-auto" />
						<span className="my-auto">Manage Notifications</span>
						<MoveRight size={16} className="my-auto" />
					</Link>*/}
				</div>
			</div>

			<H1 className="space-x-2">
				{database.enabled === false && (
					<span className="!text-slate-400">(Disabled)</span>
				)}
				{database.title ? (
					<>
						<span>{database.title}</span>
						<span>({database.name})</span>
					</>
				) : (
					<span>{database.name}</span>
				)}
			</H1>

			<div className="space-y-4 pb-4">
				<div className="text-muted-foreground">{database.description}</div>
				<div className="space-y-2 flex-grow">
					<Table>
						<TableBody>
							<TableRow>
								<TableCell className="py-1 font-medium">Database Id</TableCell>
								<TableCell className="py-1 text-slate-700">
									{database.databaseId}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="py-1 font-medium">Status</TableCell>
								<TableCell
									className={`py-1 ${
										database.state !== 'ONLINE'
											? 'text-orange-700'
											: 'text-slate-700 '
									}`}
								>
									{database.state}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="py-1 font-medium">
									Recovery Model
								</TableCell>
								<TableCell className="py-1 text-slate-700">
									{database.recoveryModel}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="py-1 font-medium">
									Compatibility Level
								</TableCell>
								<TableCell className="py-1 text-slate-700">
									{database.compatLevel}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="py-1 font-medium">
									Last Data Backup
								</TableCell>
								<TableCell className="py-1 text-slate-700 space-x-2">
									<span>{bytes(Number(database.backupDataSize)) || '-1'}</span>
									{database.backupDataDate && (
										<>
											<span>
												{formatDistance(
													new Date(database.backupDataDate),
													new Date(),
												)}{' '}
												ago.
											</span>
											<Badge className="bg-slate-200 hover:bg-slate-300 hover:cursor-default text-slate-900">
												{format(
													new Date(database.backupDataDate),
													'MMM dd, yyyy k:mm',
												)}
											</Badge>
										</>
									)}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="py-1 font-medium">
									Last Logs Backup
								</TableCell>
								<TableCell className="py-1 text-slate-700 space-x-2">
									<span>{bytes(Number(database.backupLogsSize)) || '-1'}</span>
									{database.backupLogsDate && (
										<>
											<span>
												{formatDistance(
													new Date(database.backupLogsDate),
													new Date(),
												)}{' '}
												ago.
											</span>
											<Badge className="bg-slate-200 hover:bg-slate-300 hover:cursor-default text-slate-900">
												{format(
													new Date(database.backupLogsDate),
													'MMM dd, yyyy k:mm',
												)}
											</Badge>
										</>
									)}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="py-1 font-medium">Memory Used</TableCell>
								<TableCell className="py-1 text-slate-700">
									{bytes(Number(database.usage?.[0]?.memory)) || '-1'}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="py-1 font-medium">Free</TableCell>
								<TableCell className="py-1 text-slate-700"></TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>

				<Tabs
					defaultValue={`${searchParams.get('tab') || 'memory'}`}
					className="w-full"
				>
					<TabsList className="grid max-w-[400px] grid-cols-2">
						<TabsTrigger value="memory">Memory</TabsTrigger>
						<TabsTrigger value="files">Files</TabsTrigger>
					</TabsList>
					<TabsContent value="memory">
						<MemoryChart
							url={`/${database.monitor.type}/${database.monitor.id}/database/${database.id}/memory-usage`}
						/>
					</TabsContent>
					<TabsContent value="files">
						{database.files && (
							<FilesTable
								files={database.files}
								columns={columns}
								database={database}
							/>
						)}
					</TabsContent>
				</Tabs>

				{/*<DriveChart
					url={`/${database.monitor.type}/${database.monitor.id}/database/${database.id}/usage`}
				/>*/}
				<LogTable
					url={`/${monitorType}/${monitorId}/database/${database.id}/logs`}
				/>
			</div>
		</>
	);
}
