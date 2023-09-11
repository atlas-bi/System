import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
	getDriveNotifications,
	updateDriveNotifications,
} from '~/models/drive.server';
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
import invariant from 'tiny-invariant';

export const loader = async ({ params, request }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	invariant(params.driveId);
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

	invariant(params.driveId);

	await updateDriveNotifications({
		id: params.driveId,

		missingNotify: values.missingNotify == 'on',
		missingNotifyTypes: formData.getAll('missingNotifyTypes') as string[],
		missingNotifyResendAfterMinutes:
			values.missingNotifyResend == 'on'
				? Number(values.missingNotifyResendAfterMinutes || '0')
				: 0,

		percFreeNotify: values.percFreeNotify == 'on',
		percFreeNotifyTypes: formData.getAll('percFreeNotifyTypes') as string[],
		percFreeNotifyResendAfterMinutes:
			values.percFreeNotifyResend == 'on'
				? Number(values.percFreeNotifyResendAfterMinutes || '0')
				: 0,
		percFreeValue: Number(values.percFreeValue || 0),

		sizeFreeNotify: values.sizeFreeNotify == 'on',
		sizeFreeNotifyTypes: formData.getAll('sizeFreeNotifyTypes') as string[],
		sizeFreeNotifyResendAfterMinutes:
			values.sizeFreeNotifyResend == 'on'
				? Number(values.sizeFreeNotifyResendAfterMinutes || '0')
				: 0,
		sizeFreeValue: Number(values.sizeFreeValue || 0),

		growthRateNotify: values.growthRateNotify == 'on',
		growthRateNotifyTypes: formData.getAll('growthRateNotifyTypes') as string[],
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
	const [percValue, setPercValue] = useState(drive.percFreeValue);
	const [percResendValue, setPercResendValue] = useState(
		drive.percFreeNotifyResendAfterMinutes,
	);

	const [percFreeNotifyResend, setPercFreeNotifyResend] = useState(
		drive.percFreeNotifyResendAfterMinutes !== 0,
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
											value={percValue ? Number(percValue) : undefined}
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
						</div>
					</div>
				</div>
			</Form>
		</>
	);
}
