import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
	getDatabaseFile,
	getDatabaseNotifications,
} from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';
import {
	Link,
	Outlet,
	useFetcher,
	useLoaderData,
	useParams,
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
import Drive from '~/components/driveForms/base';
import Database from '~/components/fileForms/base';
import { format, formatDistance } from 'date-fns';
import { Badge } from '~/components/ui/badge';
import { FilesTable } from './filesTable';
import { columns } from './filesTableColumns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { MemoryChart } from '~/components/charts/databaseMemoryChart';
import { FileChart } from '~/components/charts/fileChart';

export const loader = async ({ params, request }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	const fileData = await getDatabaseFile({
		id: params.fileId,
	});

	return json({ fileData });
};

export default function Index() {
	const { fileData } = useLoaderData<typeof loader>();
	let { monitorId, monitorType, databaseId } = useParams();
	const usageFetcher = useFetcher();
	const dataFetcher = useFetcher();

	const [file, setFile] = useState(fileData);

	// Get fresh header data every 30 seconds.
	useEffect(() => setFile(file), [file]);

	useEffect(() => {
		const interval = setInterval(() => {
			if (document.visibilityState === 'visible') {
				dataFetcher.load(window.location.pathname);
			}
		}, 30 * 1000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (dataFetcher.data?.file) {
			setFile(dataFetcher.data.file);
		}
	}, [dataFetcher.data]);

	useEffect(() => {
		if (usageFetcher.state === 'idle' && usageFetcher.data == null) {
			usageFetcher.load(
				`/${monitorType}/${monitorId}/database/${databaseId}/file/${file.id}/usage`,
			);
		}
	}, [usageFetcher]);

	return (
		<>
			<div className="flex justify-between pb-4">
				<Link
					to={`/${monitorType}/${monitorId}/database/${databaseId}/?tab=files`}
					className="flex content-center space-x-2 text-slate-600"
					prefetch="intent"
				>
					<MoveLeft size={16} className="my-auto" />
					<span className="my-auto">
						Back to <strong>{file.database?.name}</strong>
					</span>
				</Link>
				<Badge variant="outline" className="border-orange-600">
					File
				</Badge>
				<div className="flex divide-x">
					<Database file={file}>
						<Button variant="link" className="text-slate-700 h-6 ">
							<Settings size={16} />
						</Button>
					</Database>
					<Link
						to={`/${monitorType}/${monitorId}/database/${databaseId}/file/${file.id}/notifications`}
						className="flex content-center space-x-2 pl-3 text-slate-600"
						prefetch="intent"
					>
						<BellRing size={16} className="my-auto" />
						<span className="my-auto">Manage Notifications</span>
						<MoveRight size={16} className="my-auto" />
					</Link>
				</div>
			</div>

			<H1 className="space-x-2">
				{file.enabled === false && (
					<span className="!text-slate-400">(Disabled)</span>
				)}
				<>{file.fileName}</>
			</H1>

			<div className="space-y-4 pb-4">
				<div className="text-muted-foreground">{file.description}</div>
				<div className="space-y-2 flex-grow">
					<Table>
						<TableBody>
							<TableRow>
								<TableCell className="py-1 font-medium">File Path</TableCell>
								<TableCell className="py-1 text-slate-700">
									{file.filePath}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="py-1 font-medium">Type</TableCell>
								<TableCell className="py-1 text-slate-700">
									{file.type}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="py-1 font-medium">Status</TableCell>
								<TableCell
									className={`py-1 ${
										file.state !== 'ONLINE'
											? 'text-orange-700'
											: 'text-slate-700 '
									}`}
								>
									{file.state}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="py-1 font-medium">Auto Growth</TableCell>
								<TableCell className="py-1 text-slate-700">
									{file.growth}
									{file.isPercentGrowth == 'true' && '%'}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="py-1 font-medium">Size</TableCell>
								<TableCell className="py-1 text-slate-700">
									{' '}
									{bytes(Number(file.usage?.[0]?.size)) || '-1'}
								</TableCell>
							</TableRow>
							{file.usage?.[0]?.maxSize && (
								<TableRow>
									<TableCell className="py-1 font-medium">Max Size</TableCell>
									<TableCell className="py-1 text-slate-700">
										{' '}
										{bytes(Number(file.usage?.[0]?.maxSize)) || '-1'}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<FileChart
					url={`/${monitorType}/${monitorId}/database/${databaseId}/file/${file.id}/usage`}
				/>
				<LogTable
					url={`/${monitorType}/${monitorId}/database/${databaseId}/file/${file.id}/logs`}
				/>
			</div>
		</>
	);
}
