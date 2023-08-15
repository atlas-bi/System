import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
	getDriveNotifications,
	getMonitorNotifications,
	updateDriveNotifications,
	updateMonitorNotifications,
} from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';
import { Form, Link, useLoaderData, useParams } from '@remix-run/react';
import { H1, H3 } from '~/components/ui/typography';
import { Loader2, MoveLeft } from 'lucide-react';
import { Switch } from '~/components/ui/switch';
import { useSubmit, useNavigation } from '@remix-run/react';
import { Collapsible, CollapsibleContent } from '~/components/ui/collapsible';

import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator';
import { useRef, useState } from 'react';
import { Input } from '~/components/ui/input';
import { MultiSelect } from '~/components/ui/multiselect';
import { getNotifications } from '~/models/notification.server';

export const loader = async ({ params, request }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	const monitor = await getMonitorNotifications({ id: params.monitorId });
	if (!monitor) {
		throw new Response('Not Found', { status: 404 });
	}

	const notifications = await getNotifications();

	return json({ monitor, notifications });
};

export async function action({ request, params }: ActionArgs) {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});
	const formData = await request.formData();
	const { ...values } = Object.fromEntries(formData);

	await updateMonitorNotifications({
		id: params.monitorId,

		connectionNotify: values.connectionNotify == 'on',
		connectionNotifyTypes: formData.getAll('connectionNotifyTypes'),
		connectionNotifyResendAfterMinutes:
			values.connectionNotifyResend == 'on'
				? Number(values.connectionNotifyResendAfterMinutes || '0')
				: 0,

		rebootNotify: values.rebootNotify == 'on',
		rebootNotifyTypes: formData.getAll('rebootNotifyTypes'),
	});

	return null;
}

export default function Index() {
	const { monitor, notifications } = useLoaderData<typeof loader>();

	const submit = useSubmit();
	const transition = useNavigation();
	const notificationsMap = notifications.map(
		(n: { name: string; id: string }) => {
			return { label: n.name, value: n.id };
		},
	);
	let { monitorType, monitorId } = useParams();

	const form = useRef<HTMLFormElement>(null);

	const [connection, setConnection] = useState(
		monitor.connectionNotify == true,
	);
	const [reboot, setReboot] = useState(monitor.rebootNotify == true);

	const [connectionResendValue, setConnectionResendValue] = useState(
		monitor.connectionNotifyResendAfterMinutes,
	);

	const [connectionNotifyResend, setConnectionNotifyResend] = useState(
		monitor.connectionNotifyResendAfterMinutes !== 0,
	);

	function handleChange(event: { currentTarget: HTMLFormElement }) {
		submit(event.currentTarget);
	}

	return (
		<>
			<div className="flex space-x-2 pb-4">
				<Link
					to={`/${monitorType}/${monitorId}`}
					className={`transition-colors flex content-center space-x-2  text-slate-600 ${
						transition.state === 'submitting' ? 'pointer-events-none' : ''
					}`}
					prefetch="intent"
				>
					<MoveLeft size={16} className="my-auto" />
					<span className="my-auto">
						Back to <strong>{monitor.title}</strong>
					</span>
				</Link>
				{transition.state === 'submitting' ? (
					<Loader2 size={14} className="animate-spin my-auto" />
				) : null}
			</div>
			<H1>Notifications for {monitor.title}</H1>
			<Form ref={form} method="post" onChange={handleChange}>
				<div className="space-y-4">
					<div className=" rounded-lg border p-4 max-w-[500px]">
						<div className="space-y-2">
							<div className="space-y-2 flex justify-between">
								<div className="flex-grow">
									<H3 className="text-2xl">Data Collection</H3>
									<div className="text-muted-foreground pb-2">
										Recieve notification when data collection fails.
									</div>
								</div>
								<div className="self-start pt-2">
									<Switch
										name="connectionNotify"
										checked={connection}
										onCheckedChange={setConnection}
									/>
								</div>
							</div>

							<div
								className={`space-x-6 flex flex-row items-center justify-between transition-colors ${
									connection ? '' : 'opacity-50 text-slate-600'
								}`}
							></div>
							<Collapsible open={connection}>
								<CollapsibleContent className="space-y-2">
									<div>
										<MultiSelect
											label="Notification Methods"
											placeholder="choose"
											data={notificationsMap}
											active={notificationsMap.filter(
												(x: { value: string }) =>
													monitor.connectionNotifyTypes.filter(
														(t) => t.id == x.value,
													).length > 0,
											)}
											name="connectionNotifyTypes"
											onChange={() => {
												submit(form.current);
											}}
										/>
										<Link
											to="/admin/notifications"
											className="text-sm text-sky-600/80"
										>
											Manage notification types.
										</Link>
									</div>
									<div
										className={`space-y-2 ${
											connectionNotifyResend ? '' : 'opacity-50 text-slate-600'
										}`}
									>
										<div className={`flex justify-between `}>
											<div className='flex-grow"'>
												<Label className="text-slate-700">
													Resend Frequency (Minutes)
												</Label>
											</div>
											<Switch
												checked={connectionNotifyResend}
												onCheckedChange={setConnectionNotifyResend}
												name="connectionNotifyResend"
											/>
										</div>
										<Input
											disabled={connectionNotifyResend != true}
											type="number"
											name="connectionNotifyResendAfterMinutes"
											value={connectionResendValue || undefined}
											onChange={(e) => setConnectionResendValue(e.target.value)}
											placeholder="60"
										/>
									</div>
								</CollapsibleContent>
							</Collapsible>
						</div>
					</div>
					{(monitor.type == 'windows' || monitor.type == 'ubuntu') && (
						<div className=" rounded-lg border p-4 max-w-[500px]">
							<div className="space-y-2">
								<div className="space-y-2 flex justify-between">
									<div className="flex-grow">
										<H3 className="text-2xl">Reboot</H3>
										<div className="text-muted-foreground pb-2">
											Recieve notification when server reboots.
										</div>
									</div>
									<div className="self-start pt-2">
										<Switch
											name="rebootNotify"
											checked={reboot}
											onCheckedChange={setReboot}
										/>
									</div>
								</div>
								<div
									className={`space-x-6 flex flex-row items-center justify-between transition-colors ${
										reboot ? '' : 'opacity-50 text-slate-600'
									}`}
								></div>
								<Collapsible open={reboot}>
									<CollapsibleContent className="space-y-2">
										<div>
											<MultiSelect
												label="Notification Methods"
												placeholder="choose"
												data={notificationsMap}
												active={notificationsMap.filter(
													(x: { value: string }) =>
														monitor.rebootNotifyTypes.filter(
															(t) => t.id == x.value,
														).length > 0,
												)}
												name="rebootNotifyTypes"
												onChange={() => {
													submit(form.current);
												}}
											/>
											<Link
												to="/admin/notifications"
												className="text-sm text-sky-600/80"
											>
												Manage notification types.
											</Link>
										</div>
									</CollapsibleContent>
								</Collapsible>
							</div>
						</div>
					)}
				</div>
			</Form>
		</>
	);
}
