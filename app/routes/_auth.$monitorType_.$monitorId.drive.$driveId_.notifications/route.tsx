import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
	getDriveNotifications,
	updateDriveNotifications,
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

	const drive = await getDriveNotifications({ id: params.driveId });
	if (!drive) {
		throw new Response('Not Found', { status: 404 });
	}

	const notifications = await getNotifications();

	return json({ drive, notifications });
};

export async function action({ request, params }: ActionArgs) {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});
	const formData = await request.formData();
	const { ...values } = Object.fromEntries(formData);

	await updateDriveNotifications({
		id: params.driveId,

		missingNotify: values.missingNotify == 'on',
		missingNotifyTypes: formData.getAll('missingNotifyTypes'),
		missingNotifyResendAfterMinutes:
			values.missingNotifyResend == 'on'
				? Number(values.missingNotifyResendAfterMinutes || '0')
				: 0,

		percFreeNotify: values.percFreeNotify == 'on',
		percFreeNotifyTypes: formData.getAll('percFreeNotifyTypes'),
		percFreeNotifyResendAfterMinutes:
			values.percFreeNotifyResend == 'on'
				? Number(values.percFreeNotifyResendAfterMinutes || '0')
				: 0,
		percFreeValue: Number(values.percFreeValue || 0),

		sizeFreeNotify: values.sizeFreeNotify == 'on',
		sizeFreeNotifyTypes: formData.getAll('sizeFreeNotifyTypes'),
		sizeFreeNotifyResendAfterMinutes:
			values.sizeFreeNotifyResend == 'on'
				? Number(values.sizeFreeNotifyResendAfterMinutes || '0')
				: 0,
		sizeFreeValue: Number(values.sizeFreeValue || 0),

		growthRateNotify: values.growthRateNotify == 'on',
		growthRateNotifyTypes: formData.getAll('growthRateNotifyTypes'),
		growthRateNotifyResendAfterMinutes:
			values.growthRateNotifyResend == 'on'
				? Number(values.growthRateNotifyResendAfterMinutes || '0')
				: 0,
		growthRateValue: Number(values.growthRateValue || 0),
	});

	return null;
}

export default function Index() {
	const { drive, notifications } = useLoaderData<typeof loader>();

	const submit = useSubmit();
	const transition = useNavigation();
	const notificationsMap = notifications.map(
		(n: { name: string; id: string }) => {
			return { label: n.name, value: n.id };
		},
	);
	let { monitorType, monitorId } = useParams();

	const form = useRef<HTMLFormElement>(null);

	const [perc, setPerc] = useState(drive.percFreeNotify == true);
	const [size, setSize] = useState(drive.sizeFreeNotify == true);
	const [growth, setGrowth] = useState(drive.growthRateNotify == true);
	const [missing, setMissing] = useState(drive.missingNotify == true);

	const [percValue, setPercValue] = useState(drive.percFreeValue);
	const [sizeValue, setSizeValue] = useState(drive.sizeFreeValue);
	const [growthValue, setGrowthValue] = useState(drive.growthRateValue);

	const [percResendValue, setPercResendValue] = useState(
		drive.percFreeNotifyResendAfterMinutes,
	);
	const [missingResendValue, setMissingResendValue] = useState(
		drive.missingNotifyResendAfterMinutes,
	);
	const [sizeResendValue, setSizeResendValue] = useState(
		drive.sizeFreeNotifyResendAfterMinutes,
	);
	const [growthResendValue, setGrowthResendValue] = useState(
		drive.growthRateNotifyResendAfterMinutes,
	);

	const [percFreeNotifyResend, setPercFreeNotifyResend] = useState(
		drive.percFreeNotifyResendAfterMinutes !== 0,
	);
	const [sizeFreeNotifyResend, setSizeFreeNotifyResend] = useState(
		drive.sizeFreeNotifyResendAfterMinutes !== 0,
	);
	const [growthRateNotifyResend, setGrowthRateNotifyResend] = useState(
		drive.growthRateNotifyResendAfterMinutes !== 0,
	);
	const [missingNotifyResend, setMissingNotifyResend] = useState(
		drive.missingNotifyResendAfterMinutes !== 0,
	);

	function handleChange(event: { currentTarget: HTMLFormElement }) {
		submit(event.currentTarget);
	}

	return (
		<>
			<div className="flex space-x-2 pb-4">
				<Link
					to={`/${monitorType}/${monitorId}/drive/${drive.id}`}
					className={`transition-colors flex content-center space-x-2  text-slate-600 ${
						transition.state === 'submitting' ? 'pointer-events-none' : ''
					}`}
					prefetch="intent"
				>
					<MoveLeft size={16} className="my-auto" />
					<span className="my-auto">
						Back to{' '}
						<strong>
							{drive.name}:\{drive.location}
						</strong>
					</span>
				</Link>
				{transition.state === 'submitting' ? (
					<Loader2 size={14} className="animate-spin my-auto" />
				) : null}
			</div>
			<H1>
				Notifications for {drive.name}:\{drive.location}
			</H1>
			<Form ref={form} method="post" onChange={handleChange}>
				<div className="space-y-4">
					{/*<div className=" rounded-lg border p-4 max-w-[500px]">
						<div className="space-y-2">
							<H3 className="text-2xl">General</H3>
							<div className="text-muted-foreground pb-2">
								Recieve notification when drive dissapears.
							</div>
							<Separator />
							<div
								className={`space-x-6 flex flex-row items-center justify-between transition-colors ${
									missing ? '' : 'opacity-50 text-slate-600'
								}`}
							>
								<div className="flex-grow">
									<Label className="text-base">Missing</Label>
									<div className="text-muted-foreground pb-2">
										When server is online but the drive is not found.
									</div>
								</div>
								<div className="self-start pt-3">
									<Switch
										name="missingNotify"
										checked={missing}
										// onCheckedChange={setMissing}
									/>
								</div>
							</div>
							<Collapsible open={missing}>
								<CollapsibleContent className="space-y-2">
									<div>
										<MultiSelect
											label="Notification Methods"
											placeholder="choose"
											data={notificationsMap}
											active={notificationsMap.filter(
												(x: { value: string }) =>
													drive.missingNotifyTypes.filter(
														(t: { id: string }) => t.id == x.value,
													).length > 0,
											)}
											name="missingNotifyTypes"
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
											missingNotifyResend ? '' : 'opacity-50 text-slate-600'
										}`}
									>
										<div className={`flex justify-between `}>
											<div className='flex-grow"'>
												<Label className="text-slate-700">
													Resend Frequency (Minutes)
												</Label>
											</div>
											<Switch
												checked={missingNotifyResend}
												onCheckedChange={setMissingNotifyResend}
												name="missingNotifyResend"
											/>
										</div>
										<Input
											disabled={missingNotifyResend != true}
											type="number"
											name="missingNotifyResendAfterMinutes"
											value={missingResendValue || undefined}
											onChange={(e) =>
												setMissingResendValue(Number(e.target.value))
											}
											placeholder="60"
										/>
									</div>
								</CollapsibleContent>
							</Collapsible>
						</div>
					</div>*/}
					<div className=" rounded-lg border p-4 max-w-[500px]">
						<div className="space-y-2">
							<H3 className="text-2xl">Free Space</H3>
							<div className="text-muted-foreground pb-2">
								Recieve notification when free space meets certain criteria.
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
										name="percFreeNotify"
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
											name="percFreeValue"
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
													drive.percFreeNotifyTypes.filter(
														(t) => t.id == x.value,
													).length > 0,
											)}
											name="percFreeNotifyTypes"
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
											name="percFreeNotifyResendAfterMinutes"
											value={percResendValue || undefined}
											onChange={(e) =>
												setPercResendValue(Number(e.target.value))
											}
											placeholder="60"
										/>
									</div>
								</CollapsibleContent>
							</Collapsible>

							{/*<Separator />
							<div
								className={`space-x-6 flex flex-row items-center justify-between transition-colors  ${
									size ? '' : 'opacity-50 text-slate-600'
								}`}
							>
								<div className="flex-grow">
									<Label className="text-base">Fixed Size</Label>
									<div className="text-muted-foreground pb-2">
										When free space falls below a specific size (GB).
									</div>
								</div>
								<div className="self-start pt-3">
									<Switch
										name="sizeFreeNotify"
										checked={size}
										// onCheckedChange={setSize}
									/>
								</div>
							</div>
							<Collapsible open={size}>
								<CollapsibleContent className="space-y-2">
									<div className="space-y-1.5">
										<Label className="text-slate-700">GB</Label>
										<Input
											name="sizeFreeValue"
											type="number"
											placeholder="10"
											value={
												sizeValue === undefined || sizeValue === null
													? 0
													: sizeValue
											}
											onChange={(e) => setSizeValue(Number(e.target.value))}
										/>
									</div>
									<div>
										<MultiSelect
											label="Notification Methods"
											placeholder="choose"
											data={notificationsMap}
											active={notificationsMap.filter(
												(x: { value: string }) =>
													drive.sizeFreeNotifyTypes.filter(
														(t: { id: string }) => t.id == x.value,
													).length > 0,
											)}
											name="sizeFreeNotifyTypes"
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
											sizeFreeNotifyResend ? '' : 'opacity-50 text-slate-600'
										}`}
									>
										<div className={`flex justify-between `}>
											<div className='flex-grow"'>
												<Label className="text-slate-700">
													Resend Frequency (Minutes)
												</Label>
											</div>
											<Switch
												checked={sizeFreeNotifyResend}
												onCheckedChange={setSizeFreeNotifyResend}
												name="sizeFreeNotifyResend"
											/>
										</div>
										<Input
											disabled={sizeFreeNotifyResend != true}
											type="number"
											name="sizeFreeNotifyResendAfterMinutes"
											value={sizeResendValue || undefined}
											onChange={(e) =>
												setSizeResendValue(Number(e.target.value))
											}
											placeholder="60"
										/>
									</div>
								</CollapsibleContent>
							</Collapsible>*/}
						</div>
					</div>

					{/*<div className=" rounded-lg border p-4 max-w-[500px]">
						<div className="space-y-2">
							<H3 className="text-2xl">Growth</H3>
							<div className="text-muted-foreground pb-2">
								Recieve notification when drive grows at a specified rate.
							</div>
							<Separator />
							<div
								className={`space-x-6 flex flex-row items-center justify-between transition-colors ${
									growth ? '' : 'opacity-50 text-slate-600'
								}`}
							>
								<div className="flex-grow">
									<div className="text-muted-foreground py-2">
										When growth rate is greater than x GB/day.
									</div>
								</div>
								<div className="self-start pt-2">
									<Switch
										name="growthRateNotify"
										checked={growth}
										// onCheckedChange={setGrowth}
									/>
								</div>
							</div>
							<Collapsible open={growth}>
								<CollapsibleContent className="space-y-2">
									<div>
										<Label className="text-slate-700">GB</Label>
										<Input
											name="growthRateValue"
											type="number"
											placeholder="10"
											value={
												growthValue === undefined || growthValue === null
													? 0
													: growthValue
											}
											onChange={(e) => setGrowthValue(Number(e.target.value))}
										/>
									</div>
									<div>
										<MultiSelect
											label="Notification Methods"
											placeholder="choose"
											data={notificationsMap}
											active={notificationsMap.filter(
												(x: { value: string }) =>
													drive.growthRateNotifyTypes.filter(
														(t) => t.id == x.value,
													).length > 0,
											)}
											name="growthRateNotifyTypes"
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
											growthRateNotifyResend ? '' : 'opacity-50 text-slate-600'
										}`}
									>
										<div className={`flex justify-between `}>
											<div className='flex-grow"'>
												<Label className="text-slate-700">
													Resend Frequency (Minutes)
												</Label>
											</div>
											<Switch
												checked={growthRateNotifyResend}
												onCheckedChange={setGrowthRateNotifyResend}
												name="growthRateNotifyResend"
											/>
										</div>
										<Input
											disabled={growthRateNotifyResend != true}
											type="number"
											name="growthRateNotifyResendAfterMinutes"
											value={sizeResendValue || undefined}
											onChange={(e) =>
												setGrowthResendValue(Number(e.target.value))
											}
											placeholder="60"
										/>
									</div>
								</CollapsibleContent>
							</Collapsible>
						</div>
					</div>*/}
				</div>
			</Form>
		</>
	);
}
