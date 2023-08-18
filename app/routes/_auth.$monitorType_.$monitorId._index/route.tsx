import bytes from 'bytes';
import { useEffect } from 'react';
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';
import { DoughnutChart } from '~/components/charts/driveDoughnut';
import { H1, H3 } from '~/components/ui/typography';
import { LoaderArgs, redirect } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getMonitorPublic } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';

import { Link, useFetcher, useLoaderData, useLocation } from '@remix-run/react';
import {
	BellRing,
	MoveLeft,
	MoveRight,
	Settings,
	ToggleRight,
} from 'lucide-react';
import { Skeleton } from '~/components/ui/skeleton';
import invariant from 'tiny-invariant';

import type { Drive, DriveUsage, MonitorLogs } from '~/models/monitor.server';
import { LogTable } from '~/components/logTable/table';
import { monitorTypes } from '~/models/monitor';
import { format } from 'date-fns';

import Monitor from '~/components/monitorForms/base';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Button } from '~/components/ui/button';
import { decrypt } from '@/lib/utils';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '/components/ui/dropdown-menu';
import { ToggleLeft } from 'lucide-react';
import { CpuChart } from '~/components/charts/cpuChart';
import { MemoryChart } from '~/components/charts/memoryChart';
import { SshStats, SshSystem } from './ssh';
import { SqlStats, SqlSystem } from './sql';
import { PingChart } from '~/components/charts/pingChart';
import { parseSqlConnectionString } from '@tediousjs/connection-string';
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
		monitor: {
			...monitor,
			password: monitor.password ? decrypt(monitor.password) : undefined,
			privateKey: monitor.privateKey ? decrypt(monitor.privateKey) : undefined,
			httpPassword: monitor.httpPassword
				? decrypt(monitor.httpPassword)
				: undefined,
			sqlConnectionString: monitor.sqlConnectionString
				? decrypt(monitor.sqlConnectionString)
				: undefined,
		},
	});
};

export default function Index() {
	const { monitor } = useLoaderData<typeof loader>();

	const sqlConnectionString = monitor.sqlConnectionString
		? parseSqlConnectionString(monitor.sqlConnectionString, true)
		: undefined;

	return (
		<>
			<div className="flex justify-between pb-4">
				<Link
					to={`/${monitor.type}`}
					className="flex content-center space-x-2 text-slate-700"
					prefetch="intent"
				>
					<MoveLeft size={16} className="my-auto" />
					<span className="my-auto">Back to Monitors</span>
				</Link>
				<div className="flex divide-x">
					<Monitor monitor={monitor}>
						<Button variant="link" className="text-slate-700 h-6 ">
							<Settings size={16} />
						</Button>
					</Monitor>
					<Link
						to={`/${monitor.type}/${monitor.id}/notifications`}
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
				{monitor.enabled === false && (
					<span className="!text-slate-400">(Disabled)</span>
				)}
				<span>{monitor.title}</span>
				{monitor.type === 'http' && monitor.httpUrl ? (
					<span>({monitor.httpUrl})</span>
				) : monitor.type === 'sqlServer' ? (
					<span>({sqlConnectionString?.['data source']})</span>
				) : (
					monitor.host && <span>({monitor.host})</span>
				)}
			</H1>
			<div className="space-y-4 pb-4">
				<div className="text-muted-foreground">{monitor.description}</div>

				{(monitor.type == 'windows' || monitor.type == 'ubuntu') && (
					<>
						<SshSystem monitor={monitor} />
						<SshStats monitor={monitor} />
					</>
				)}

				{monitor.type == 'sqlServer' && (
					<>
						<SqlSystem monitor={monitor} />
						<SqlStats monitor={monitor} />
					</>
				)}

				{monitor.type == 'http' && (
					<PingChart url={`/${monitor.type}/${monitor.id}/ping`} />
				)}

				<LogTable url={`/${monitor.type}/${monitor.id}/logs`} />
			</div>
		</>
	);
}
