import { Form, useFetcher, useNavigate } from '@remix-run/react';
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

import { monitorTypes } from '~/models/monitor';
import { Textarea } from '~/components/ui/textarea';
import { Loader2 } from 'lucide-react';

import type { Notification } from '~/models/notification.server';

export default function NewMonitor({ className }: { className: string }) {
	const [open, setOpen] = useState(false);
	const fetcher = useFetcher();
	const testFetcher = useFetcher();
	const navigate = useNavigate();

	const [data, setData] = useState<Notification>({});

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.monitor != null) {
			setData({});
			setOpen(false);
			navigate(`/${fetcher.data.monitor.type}/${fetcher.data.monitor.id}`);
		}
	}, [fetcher]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" className={className}>
					Add Monitor
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:min-w-[425px] sm:max-w-fit">
				<DialogHeader>
					<DialogTitle>Add Monitor</DialogTitle>
					<DialogDescription>Add a new monitor.</DialogDescription>
				</DialogHeader>
				{testFetcher.data?.error?.code ? (
					<small className="text-red-700">
						{testFetcher.data?.error?.code}
					</small>
				) : testFetcher.data?.error ? (
					<small className="text-red-700">Failed to connect.</small>
				) : (
					<></>
				)}
				{testFetcher.state !== 'submitting' && testFetcher.data?.form?.error ? (
					<small className="text-red-700">{testFetcher.data.form.error}</small>
				) : null}
				{fetcher.state !== 'submitting' && fetcher.data?.form?.error ? (
					<small className="text-red-700">{fetcher.data.form.error}</small>
				) : null}
				{testFetcher.state !== 'submitting' && testFetcher.data?.success ? (
					<small className="text-green-700">{testFetcher.data.success}</small>
				) : null}
				<Form method="post" action="/monitor/new">
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="name" className="text-right">
								Name
							</Label>
							<Input
								type="text"
								id="name"
								placeholder="Server 1"
								className="col-span-3"
								onChange={(e) => setData({ ...data, name: e.target.value })}
							/>
							<Select
								onValueChange={(type: string) => setData({ ...data, type })}
							>
								<Label htmlFor="name" className="text-right">
									Monitor Type
								</Label>
								<SelectTrigger className="col-span-3">
									<SelectValue placeholder="select one" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{monitorTypes.map((type) => (
											<SelectItem key={type.value} value={type.value}>
												{type.name}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
							<Label htmlFor="host" className="text-right">
								Host
							</Label>
							<Input
								type="text"
								id="host"
								placeholder="server1"
								className="col-span-3"
								onChange={(e) => setData({ ...data, host: e.target.value })}
							/>
							<Label htmlFor="port" className="text-right">
								Port
							</Label>
							<Input
								type="number"
								value="22"
								id="port"
								placeholder="22"
								className="col-span-3"
								onChange={(e) =>
									setData({ ...data, port: Number(e.target.value) })
								}
							/>
							<Label htmlFor="username" className="text-right">
								Username
							</Label>
							<Input
								type="text"
								id="username"
								placeholder="username"
								className="col-span-3"
								onChange={(e) => setData({ ...data, username: e.target.value })}
							/>
							<Label htmlFor="password" className="text-right">
								Password
							</Label>
							<Input
								type="password"
								id="password"
								placeholder="123"
								className="col-span-3"
								onChange={(e) => setData({ ...data, password: e.target.value })}
							/>
							<Label htmlFor="privateKey" className="text-right">
								Private Key
							</Label>
							<Textarea
								id="privateKey"
								className="col-span-3"
								onChange={(e) =>
									setData({ ...data, privateKey: e.target.value })
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								console.log('submitting');
								testFetcher.submit(
									{ _action: 'test', ...data },
									{ method: 'post', action: '/monitor/new' },
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
								fetcher.submit(
									{ _action: 'new', ...data },
									{ method: 'post', action: '/monitor/new' },
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
