import { Link, useFetcher, useLocation } from '@remix-run/react';
import bytes from 'bytes';
import { AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { Dispatch, useEffect } from 'react';
import { DoughnutChart } from '~/components/charts/driveDoughnut';
import { Skeleton } from '~/components/ui/skeleton';
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';
import { H3 } from '~/components/ui/typography';
import { Drive, Monitor } from '~/models/monitor.server';

export const MiniDrive = ({
	monitor,
	drive,
}: {
	monitor: Monitor;
	drive: Drive;
}) => {
	const usageFetcher = useFetcher();
	const location = useLocation();

	// if we redirect to another monitor we need to reload drives
	useEffect(() => {
		if (usageFetcher.state === 'idle' && usageFetcher.data == null) {
			usageFetcher.load(
				`/${monitor.type}/${monitor.id}/drive/${drive.id}/usage`,
			);
		}
	}, [location]);

	useEffect(() => {
		if (usageFetcher.state === 'idle' && usageFetcher.data == null) {
			usageFetcher.load(
				`/${monitor.type}/${monitor.id}/drive/${drive.id}/usage`,
			);
		}
	}, [usageFetcher]);

	return (
		<Link
			to={`/${monitor.type}/${monitor.id}/drive/${drive.id}`}
			prefetch="intent"
			key={drive.id}
			className={`transition-colors flex space-x-4 border rounded-md py-2 px-4 cursor-pointer hover:shadow hover:shadow-sky-200 ${
				!drive.enabled || !drive.online ? 'opacity-50 hover:opacity-100' : ''
			}`}
		>
			<div>
				{drive.enabled ? (
					!drive.online ? (
						<div className="flex space-x-2 text-muted-foreground center-content">
							<AlertTriangle size={16} className="text-red-400 my-auto" />
							<span>Offline</span>
						</div>
					) : (
						<ToggleRight size={20} className="text-slate-400" />
					)
				) : (
					<ToggleLeft size={20} className="fill-slate-200 text-slate-400" />
				)}
				{usageFetcher.data ? (
					<DoughnutChart
						className="w-36 h-36"
						data={{
							labels: [
								`Used ${bytes(
									Number(usageFetcher.data?.drive?.usage?.[0]?.used),
								)}`,
								`Free ${bytes(
									Number(usageFetcher.data?.drive?.usage?.[0]?.free),
								)}`,
							],
							datasets: [
								{
									label: 'Drive Usage',
									data: [
										Number(usageFetcher.data?.drive?.usage?.[0]?.used),
										Number(usageFetcher.data?.drive?.usage?.[0]?.used) +
											Number(usageFetcher.data?.drive?.usage?.[0]?.free) ==
										0
											? 100
											: Number(usageFetcher.data?.drive?.usage?.[0]?.free),
									],
								},
							],
						}}
					/>
				) : (
					<Skeleton className="w-36 h-36 rounded-full" />
				)}
			</div>

			<div className="space-y-2 flex-grow min-w-[1px]">
				<H3 className="space-x-2 flex-shrink-0">
					{drive.title ? (
						<>
							<span>{drive.title}</span>
							<span>({drive.root})</span>
						</>
					) : monitor.type == 'ubuntu' && drive.name ? (
						<span>
							{drive.root} ({drive.name})
						</span>
					) : (
						<span>
							{drive.root}
							{drive.location}
						</span>
					)}
				</H3>
				<Table>
					<TableBody>
						<TableRow>
							<TableCell className="py-1 font-medium">Size</TableCell>
							<TableCell className="py-1 text-slate-800">
								{bytes(Number(drive.size))}
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="py-1">Used</TableCell>
							<TableCell className="py-1 text-slate-800">
								{usageFetcher.data ? (
									bytes(Number(usageFetcher?.data?.drive?.usage?.[0]?.used)) ||
									'-1'
								) : (
									<Skeleton className="h-3 w-full max-w-[60px] rounded-sm" />
								)}
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="py-1 font-medium">Free</TableCell>
							<TableCell className="py-1 text-slate-800">
								{usageFetcher.data ? (
									bytes(Number(usageFetcher?.data?.drive?.usage?.[0]?.free)) ||
									'-1'
								) : (
									<Skeleton className="h-3 w-full max-w-[60px] rounded-sm" />
								)}
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="py-1 font-medium">Days Till Full</TableCell>
							<TableCell className="py-1 text-slate-800">
								{usageFetcher.data ? (
									usageFetcher?.data?.drive?.daysTillFull
								) : (
									<Skeleton className="h-3 w-full max-w-[60px] rounded-sm" />
								)}
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="py-1 font-medium">Growth Rate</TableCell>
							<TableCell className="py-1 text-slate-800">
								{usageFetcher.data ? (
									<>
										{bytes(Number(usageFetcher?.data?.drive?.growthRate)) ||
											'-1'}
										/day
									</>
								) : (
									<Skeleton className="h-3 w-full max-w-[60px] rounded-sm" />
								)}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>
		</Link>
	);
};
