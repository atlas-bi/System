import { Form, useFetcher } from '@remix-run/react';
import { useEffect, useState } from 'react';
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
import { SmtpForm } from './notificationForms/smpt';
import { TelegramForm } from './notificationForms/telegram';
import { Loader2 } from 'lucide-react';
import type { Notification } from '~/models/notification.server';

export default function NewNotification({ className }: { className: string }) {
	const [open, setOpen] = useState(false);
	const fetcher = useFetcher();
	const testFetcher = useFetcher();

	const [data, setData] = useState<Notification>({ smtpPort: '25' });

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.success != null) {
			setData({});
			setOpen(false);
		}
	}, [fetcher]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" className={className}>
					Add Notification
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:min-w-[425px] sm:max-w-fit">
				<DialogHeader>
					<DialogTitle>Add Notification</DialogTitle>
					<DialogDescription>
						Add a new way to recieve notifications
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
								placeholder="Notification 1"
								className="col-span-3"
								onChange={(e) => setData({ ...data, name: e.target.value })}
							/>
							<Select
								onValueChange={(type: string) => setData({ ...data, type })}
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
						<Button
							type="button"
							onClick={(e) => {
								testFetcher.submit(
									{ _action: 'test', ...data },
									{ method: 'post', action: '/admin/notifications/new' },
								);
							}}
						>
							{testFetcher.state == 'submitting' ? (
								<>
									<Loader2 size={14} className="animate-spin mr-2" /> Testing...
								</>
							) : (
								<>Test</>
							)}
						</Button>
						<Button
							type="button"
							onClick={(e) => {
								fetcher.submit(
									{ _action: 'new', ...data },
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
