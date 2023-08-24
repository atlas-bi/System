import { H1 } from '~/components/ui/typography';
import { LoaderArgs, redirect } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getMonitorPublic } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';
import { Link, useLoaderData } from '@remix-run/react';
import {
	Activity,
	AlertTriangle,
	BellRing,
	MoveLeft,
	MoveRight,
	Settings,
} from 'lucide-react';
import invariant from 'tiny-invariant';
import { LogTable } from '~/components/logTable/table';
import { monitorTypes } from '~/models/monitor';
import Monitor from '~/components/monitorForms/base';
import { Button } from '~/components/ui/button';
import { decrypt } from '@/lib/utils';
import { SshStats, SshSystem } from './ssh';
import { SqlStats, SqlSystem } from './sql';
import { PingChart } from '~/components/charts/pingChart';
import { parseSqlConnectionString } from '@tediousjs/connection-string';
import { Badge } from '~/components/ui/badge';
import { PingStat } from './responseTime';
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
				<Badge variant="outline" className="border-orange-600">
					{monitorTypes.filter((x) => x.value === monitor.type)?.[0]?.name}
				</Badge>
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
			<div className="flex flex-wrap justify-between">
				<H1 className="space-x-2 flex">
					{monitor.enabled === false ? (
						<span className="!text-slate-400">(Disabled)</span>
					) : monitor.hasError ? (
						<AlertTriangle className="text-red-500 my-auto" size={18} />
					) : (
						<Activity className="text-emerald-600 my-auto" size={18} />
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
				{monitor.type == 'http' && (
					<PingStat url={`/${monitor.type}/${monitor.id}/ping-latest`} />
				)}
			</div>
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
