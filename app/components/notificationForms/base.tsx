import { Form, useFetcher, useNavigate, useSubmit } from '@remix-run/react';
import { ReactNode, useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select';

import { notificationTypes } from '~/models/notification';
import { SmtpForm } from '~/components/notificationForms/smpt';
import { TelegramForm } from '~/components/notificationForms/telegram';
import { Loader2 } from 'lucide-react';
import type { Notification } from '~/models/notification.server';

export default function Notification({
	notification,
	children,
}: {
	notification: Notification;
	children: ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const fetcher = useFetcher();
	const deleteSubmit = useSubmit();
	const testFetcher = useFetcher();

	const [data, setData] = useState<Notification>(notification);

	useEffect(() => {
		if (!notification.id || notification.id !== data.id) {
			setData(notification);
		}
	}, [notification]);

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.notification != null) {
			setOpen(false);
		}
	}, [fetcher]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:min-w-[425px] sm:max-w-fit">
				<DialogHeader>
					<DialogTitle>
						{notification.name ? `${notification.name}` : 'Add Notification'}
					</DialogTitle>
					<DialogDescription>
						{notification.name
							? `Editing notification.`
							: `Add a new way to recieve notifications`}
					</DialogDescription>
				</DialogHeader>
				{fetcher.state !== 'submitting' && fetcher.data?.form?.error ? (
					<small className="text-red-700">{fetcher.data.form.error}</small>
				) : null}
				{fetcher.data?.error?.code ? (
					<small className="text-red-700">{fetcher.data?.error?.code}</small>
				) : fetcher.data?.error ? (
					<small className="text-red-700">Failed to connect.</small>
				) : (
					<></>
				)}
				{testFetcher.state !== 'submitting' && testFetcher.data?.form?.error ? (
					<small className="text-red-700">{testFetcher.data.form.error}</small>
				) : null}
				{testFetcher.data?.error?.code ? (
					<small className="text-red-700">
						{testFetcher.data?.error?.code}
					</small>
				) : testFetcher.data?.error ? (
					<small className="text-red-700">Failed to connect.</small>
				) : (
					<></>
				)}
				{testFetcher.state !== 'submitting' && testFetcher.data?.success ? (
					<small className="text-green-700">{testFetcher.data.success}</small>
				) : null}
				<Form method="post" action="/servers/new">
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="name" className="text-right">
								Name*
							</Label>
							<Input
								type="text"
								id="name"
								value={data.name || ''}
								placeholder="Notification 1"
								className="col-span-3"
								onChange={(e) => setData({ ...data, name: e.target.value })}
							/>
							<Select
								onValueChange={(type: string) => setData({ ...data, type })}
								value={data.type}
							>
								<Label htmlFor="name" className="text-right">
									Type*
								</Label>
								<SelectTrigger className="col-span-3">
									<SelectValue placeholder="select one" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{notificationTypes.map((type) => (
											<SelectItem key={type.value} value={type.value}>
												{type.name}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
							{data?.type === 'smtp' && (
								<SmtpForm data={data} setData={setData} />
							)}

							{data?.type === 'telegram' && (
								<TelegramForm data={data} setData={setData} />
							)}
						</div>
					</div>
					<DialogFooter>
						{data.id && (
							<Button
								type="button"
								variant="outline"
								onClick={(e) => {
									e.preventDefault();
									deleteSubmit(
										{ _action: 'delete', id: data.id },
										{ method: 'post', action: '/admin/notifications/new' },
									);
									setOpen(false);
								}}
								className="border-red-300"
							>
								Delete
							</Button>
						)}
						<Button
							type="button"
							onClick={(e) => {
								testFetcher.submit(
									{
										_action: 'test',
										...JSON.parse(
											JSON.stringify(data, (_k, v) => v ?? undefined),
										),
									},
									{ method: 'post', action: '/admin/notifications/new' },
								);
							}}
						>
							{testFetcher.state !== 'submitting' ? (
								<>Test</>
							) : (
								<>
									<Loader2 size={14} className="animate-spin mr-2" /> Testing...
								</>
							)}
						</Button>
						<Button
							type="button"
							onClick={(e) => {
								// ugly json parse to remove null/blank/undefined
								fetcher.submit(
									{
										_action: 'new',
										...JSON.parse(
											JSON.stringify(data, (_k, v) => v ?? undefined),
										),
									},
									{ method: 'post', action: '/admin/notifications/new' },
								);
							}}
						>
							Save
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
