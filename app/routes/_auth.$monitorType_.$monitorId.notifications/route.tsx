import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
	getMonitorNotifications,
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

import { useRef, useState } from 'react';
import { Input } from '~/components/ui/input';
import { MultiSelect } from '~/components/ui/multiselect';
import { getNotifications } from '~/models/notification.server';
import invariant from 'tiny-invariant';
import { Separator } from '~/components/ui/separator';

export const loader = async ({ params, request }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});
	invariant(params.monitorId);
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

	invariant(params.monitorId);

	await updateMonitorNotifications({
		id: params.monitorId,

		connectionNotify: values.connectionNotify == 'on',
		connectionNotifyTypes: formData
			.getAll('connectionNotifyTypes')
			.map((x) => x.toString()),
		connectionNotifyResendAfterMinutes:
			values.connectionNotifyResend == 'on'
				? Number(values.connectionNotifyResendAfterMinutes || '0')
				: 0,
		connectionNotifyRetries: Number(values.connectionNotifyRetries || '0'),
		httpCertNotify: values.httpCertNotify == 'on',
		httpCertNotifyTypes: formData
			.getAll('httpCertNotifyTypes')
			.map((x) => x.toString()),
		httpCertNotifyResendAfterMinutes:
			values.httpCertNotifyResend == 'on'
				? Number(values.httpCertNotifyResendAfterMinutes || '0')
				: 0,
		rebootNotify: values.rebootNotify == 'on',
		rebootNotifyTypes: formData
			.getAll('rebootNotifyTypes')
			.map((x) => x.toString()),

		sqlFileSizePercentFreeNotify: values.sqlFileSizePercentFreeNotify == 'on',
		sqlFileSizePercentFreeNotifyTypes: formData
			.getAll('sqlFileSizePercentFreeNotifyTypes')
			.map((x) => x.toString()),
		sqlFileSizePercentFreeNotifyResendAfterMinutes:
			values.percFreeNotifyResend == 'on'
				? Number(values.sqlFileSizePercentFreeNotifyResendAfterMinutes || '0')
				: 0,
		sqlFileSizePercentFreeValue: Number(
			values.sqlFileSizePercentFreeValue || 0,
		),
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
	const [httpCert, setHttpCert] = useState(monitor.httpCertNotify == true);
	const [perc, setPerc] = useState(
		monitor.sqlFileSizePercentFreeNotify == true,
	);
	const [connectionResendValue, setConnectionResendValue] = useState(
		monitor.connectionNotifyResendAfterMinutes,
	);
	const [percValue, setPercValue] = useState(
		monitor.sqlFileSizePercentFreeValue,
	);

	const [httpCertResendValue, setHttpCertResendValue] = useState(
		monitor.httpCertNotifyResendAfterMinutes,
	);
	const [httpCertNotifyResend, setHttpCertNotifyResend] = useState(
		monitor.httpCertNotifyResendAfterMinutes !== 0,
	);

	const [connectionRetries, setConnectionRetries] = useState(
		monitor.connectionNotifyRetries || 0,
	);

	const [connectionNotifyResend, setConnectionNotifyResend] = useState(
		monitor.connectionNotifyResendAfterMinutes !== 0,
	);
	const [percResendValue, setPercResendValue] = useState(
		monitor.sqlFileSizePercentFreeNotifyResendAfterMinutes,
	);
	const [percFreeNotifyResend, setPercFreeNotifyResend] = useState(
		monitor.sqlFileSizePercentFreeNotifyResendAfterMinutes !== 0,
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
									<div className="space-y-2">
										<Label className="text-slate-700">Retry Attempts</Label>
										<Input
											type="number"
											name="connectionNotifyRetries"
											value={connectionRetries || 0}
											onChange={(e) =>
												setConnectionRetries(Number(e.target.value))
											}
											placeholder="3"
										/>
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
											onChange={(e) =>
												setConnectionResendValue(Number(e.target.value))
											}
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
					{monitor.type == 'http' &&
						monitor.httpUrl?.startsWith('https:') &&
						monitor.httpCheckCert && (
							<div className=" rounded-lg border p-4 max-w-[500px]">
								<div className="space-y-2">
									<div className="space-y-2 flex justify-between">
										<div className="flex-grow">
											<H3 className="text-2xl">Certificate</H3>
											<div className="text-muted-foreground pb-2">
												Recieve notification when certificate is invalid or near
												expiry.
											</div>
										</div>
										<div className="self-start pt-2">
											<Switch
												name="httpCertNotify"
												checked={httpCert}
												onCheckedChange={setHttpCert}
											/>
										</div>
									</div>
									<div
										className={`space-x-6 flex flex-row items-center justify-between transition-colors ${
											httpCert ? '' : 'opacity-50 text-slate-600'
										}`}
									></div>
									<Collapsible open={httpCert}>
										<CollapsibleContent className="space-y-2">
											<div>
												<MultiSelect
													label="Notification Methods"
													placeholder="choose"
													data={notificationsMap}
													active={notificationsMap.filter(
														(x: { value: string }) =>
															monitor.httpCertNotifyTypes.filter(
																(t: { id: string }) => t.id == x.value,
															).length > 0,
													)}
													name="httpCertNotifyTypes"
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
													httpCertNotifyResend
														? ''
														: 'opacity-50 text-slate-600'
												}`}
											>
												<div className={`flex justify-between `}>
													<div className='flex-grow"'>
														<Label className="text-slate-700">
															Resend Frequency (Minutes)
														</Label>
													</div>
													<Switch
														checked={httpCertNotifyResend}
														onCheckedChange={setHttpCertNotifyResend}
														name="httpCertNotifyResend"
													/>
												</div>
												<Input
													disabled={httpCertNotifyResend != true}
													type="number"
													name="httpCertNotifyResendAfterMinutes"
													value={httpCertResendValue || undefined}
													onChange={(e) =>
														setHttpCertResendValue(Number(e.target.value))
													}
													placeholder="60"
												/>
											</div>
										</CollapsibleContent>
									</Collapsible>
								</div>
							</div>
						)}
					{monitor.type === 'sqlServer' && (
						<div className=" rounded-lg border p-4 max-w-[500px]">
							<div className="space-y-2">
								<H3 className="text-2xl">File Free Space</H3>
								<div className="text-muted-foreground pb-2">
									Recieve notification when files free space meets certain
									criteria.{' '}
									<strong>
										This applies to files with auto growth disabled or file with
										a max size.
									</strong>
								</div>
								<Separator />
								<div
									className={`space-x-6 flex flex-row items-center justify-between transition-colors ${
										perc ? '' : 'opacity-50 text-slate-600'
									}`}
								>
									<div className="flex-grow">
										<Label className="text-base">Percentage</Label>

										<div className="text-muted-foreground pb-2">
											When free space falls below a percentage (%).
										</div>
									</div>
									<div className="self-start  pt-3">
										<Switch
											name="sqlFileSizePercentFreeNotify"
											checked={perc}
											onCheckedChange={setPerc}
										/>
									</div>
								</div>
								<Collapsible open={perc}>
									<CollapsibleContent className="space-y-2">
										<div>
											<Label className="text-slate-700">Percentage</Label>
											<Input
												name="sqlFileSizePercentFreeValue"
												type="number"
												placeholder="10"
												value={percValue}
												onChange={(e) => setPercValue(Number(e.target.value))}
											/>
										</div>
										<div>
											<MultiSelect
												label="Notification Methods"
												placeholder="choose"
												data={notificationsMap}
												active={notificationsMap.filter(
													(x: { value: string }) =>
														monitor.sqlFileSizePercentFreeNotifyTypes.filter(
															(t) => t.id == x.value,
														).length > 0,
												)}
												name="sqlFileSizePercentFreeNotifyTypes"
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
												percFreeNotifyResend ? '' : 'opacity-50 text-slate-600'
											}`}
										>
											<div className={`flex justify-between `}>
												<div className='flex-grow"'>
													<Label className="text-slate-700">
														Resend Frequency (Minutes)
													</Label>
												</div>
												<Switch
													checked={percFreeNotifyResend}
													onCheckedChange={setPercFreeNotifyResend}
													name="percFreeNotifyResend"
												/>
											</div>
											<Input
												disabled={percFreeNotifyResend != true}
												type="number"
												name="sqlFileSizePercentFreeNotifyResendAfterMinutes"
												value={percResendValue || undefined}
												onChange={(e) =>
													setPercResendValue(Number(e.target.value))
												}
												placeholder="60"
											/>
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
