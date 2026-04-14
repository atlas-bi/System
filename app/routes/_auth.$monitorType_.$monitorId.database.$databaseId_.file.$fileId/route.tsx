import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getDatabaseFile } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';
import { Link, useFetcher, useLoaderData, useParams } from '@remix-run/react';
import { H1 } from '~/components/ui/typography';
import { BellRing, MoveLeft, MoveRight, Settings } from 'lucide-react';
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';
import bytes from 'bytes';
import { useEffect, useState } from 'react';
import { LogTable } from '~/components/logTable/table';
import { Button } from '~/components/ui/button';
import File from '~/components/fileForms/base';
import { Badge } from '~/components/ui/badge';
import { FileChart } from '~/components/charts/fileChart';
import invariant from 'tiny-invariant';
import { Skeleton } from '~/components/ui/skeleton';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	invariant(params.fileId);

	const fileData = await getDatabaseFile({
		id: params.fileId,
	});

	invariant(fileData);

	return json({ fileData });
};

export default function Index() {
	const { fileData } = useLoaderData<typeof loader>();
	let { monitorId, monitorType, databaseId } = useParams();
	const usageFetcher = useFetcher<{ usage?: any }>();
	const dataFetcher = useFetcher<typeof loader>();

	const [file, setFile] = useState(fileData);

	useEffect(() => setFile(fileData), [fileData]);

	useEffect(() => {
		const interval = setInterval(() => {
			if (document.visibilityState === 'visible') {
				dataFetcher.load(window.location.pathname);
				usageFetcher.load(
					`/${monitorType}/${monitorId}/database/${databaseId}/file/${file.id}/usage-latest`,
				);
			}
		}, 30 * 1000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (dataFetcher.data?.fileData) {
			setFile(dataFetcher.data.fileData as any);
		}
	}, [dataFetcher.data]);

	useEffect(() => {
		if (usageFetcher.state === 'idle' && usageFetcher.data == null) {
			usageFetcher.load(
				`/${monitorType}/${monitorId}/database/${databaseId}/file/${file.id}/usage-latest`,
			);
		}
	}, [
		usageFetcher.state,
		usageFetcher.data,
		monitorType,
		monitorId,
		databaseId,
		file.id,
	]);

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
					<File file={file as any} setter={setFile as any}>
						<Button variant="link" className="text-slate-700 h-6 ">
							<Settings size={16} />
						</Button>
					</File>
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
				<span>{file.fileName}</span>
			</H1>

			<div className="space-y-4 pb-4">
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
									{Number(file.growth) > 1 && file.isPercentGrowth !== 'true'
										? bytes(Number(file.growth))
										: file.growth}
									{file.isPercentGrowth == 'true' && '%'}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="py-1 font-medium">Data Size</TableCell>
								<TableCell className="py-1 text-slate-700">
									{usageFetcher.data ? (
										bytes(Number(usageFetcher?.data?.usage?.usedSize)) || '-1'
									) : (
										<Skeleton className="h-3 w-full max-w-[60px] rounded-sm" />
									)}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="py-1 font-medium">File Size</TableCell>
								<TableCell className="py-1 text-slate-700">
									{usageFetcher.data ? (
										bytes(Number(usageFetcher?.data?.usage?.currentSize)) ||
										'-1'
									) : (
										<Skeleton className="h-3 w-full max-w-[60px] rounded-sm" />
									)}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="py-1 font-medium">Max Size</TableCell>
								<TableCell className="py-1 text-slate-700">
									{usageFetcher.data ? (
										bytes(Number(usageFetcher?.data?.usage?.maxSize)) || '-1'
									) : (
										<Skeleton className="h-3 w-full max-w-[60px] rounded-sm" />
									)}
								</TableCell>
							</TableRow>
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
