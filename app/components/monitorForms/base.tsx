import { Form, useFetcher, useNavigate, useSubmit } from '@remix-run/react';
import { Children, useEffect, useState } from 'react';
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

import type { Monitor } from '~/models/monitor.server';
import SshForm from './ssh';

export default function Monitor({ monitor, children }: { monitor: Monitor }) {
	const [open, setOpen] = useState(false);
	const fetcher = useFetcher();
	const deleteSubmit = useSubmit();
	const testFetcher = useFetcher();
	const navigate = useNavigate();

	const [data, setData] = useState<Monitor>(monitor);

	useEffect(() => setData(monitor), [monitor]);

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.monitor != null) {
			if (!monitor.id) {
				setData({});
				setOpen(false);
				navigate(`/${fetcher.data.monitor.type}/${fetcher.data.monitor.id}`);
			} else {
				setOpen(false);
			}
		}
	}, [fetcher]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:min-w-[425px] sm:max-w-fit">
				<DialogHeader>
					<DialogTitle>
						{monitor.name ? `${monitor.name}` : 'Add Monitor'}
					</DialogTitle>
					<DialogDescription>
						{monitor.name ? `Editing monitor.` : 'Add a new monitor.'}
					</DialogDescription>
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
								Name*
							</Label>
							<Input
								type="text"
								id="name"
								value={data.title}
								placeholder="Server 1"
								className="col-span-3"
								onChange={(e) => setData({ ...data, title: e.target.value })}
							/>
							<Label htmlFor="description" className="text-right">
								Description
							</Label>
							<Textarea
								id="description"
								className="col-span-3"
								value={data.description || ''}
								onChange={(e) =>
									setData({ ...data, description: e.target.value })
								}
							/>
							<Select
								onValueChange={(type: string) => setData({ ...data, type })}
								value={data.type}
							>
								<Label htmlFor="name" className="text-right">
									Monitor Type*
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
							{(data.type === 'windows' || data.type === 'ubuntu') && (
								<SshForm data={data} setData={setData} />
							)}
						</div>
					</div>
					<DialogFooter className="sm:justify-between">
						{data.id && (
							<Button
								type="button"
								variant="outline"
								onClick={(e) => {
									e.preventDefault();
									deleteSubmit(
										{ _action: 'delete', id: data.id },
										{ method: 'post', action: '/monitor/new' },
									);
								}}
								className="border-red-300"
							>
								Delete
							</Button>
						)}
						<div className="flex space-x-2">
							<Button
								type="button"
								onClick={(e) => {
									e.preventDefault();
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
										<Loader2 size={14} className="animate-spin mr-2" />{' '}
										Testing...
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
						</div>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
