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

import { monitorTypes } from '~/models/monitor';
import { Textarea } from '~/components/ui/textarea';
import { Loader2 } from 'lucide-react';

import type { Monitor } from '~/models/monitor.server';
import SshForm from './ssh';
import { Switch } from '~/components/ui/switch';
import HttpForm from './http';
import SqlForm from './sql';
import TcpForm from './tcp';

export default function Monitor({
	monitor,
	children,
}: {
	monitor: Monitor;
	children: ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const fetcher = useFetcher();
	const deleteSubmit = useSubmit();
	const testFetcher = useFetcher();
	const navigate = useNavigate();

	const [data, setData] = useState<Monitor>(monitor);

	useEffect(() => {
		if (!monitor.id || monitor.id !== data.id) {
			setData(monitor);
		}
	}, [monitor]);

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.monitor != null) {
			if (!monitor.id) {
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
						{monitor.title ? `${monitor.title}` : 'Add Monitor'}
					</DialogTitle>
					<DialogDescription>
						{monitor.title ? `Editing monitor.` : 'Add a new monitor.'}
					</DialogDescription>
				</DialogHeader>
				{testFetcher.data?.error?.code ? (
					<small className="text-red-700">
						{testFetcher.data?.error?.code}
					</small>
				) : testFetcher.data?.error?.message ? (
					<small className="text-red-700">
						{testFetcher.data?.error?.message}
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
								value={data.title || ''}
								placeholder="Monitor 1"
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
							<Label className="text-right">Enabled</Label>
							<div className="self-start col-span-3">
								<Switch
									name="enabled"
									checked={data.enabled}
									onCheckedChange={(enabled) => setData({ ...data, enabled })}
								/>
							</div>
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
							{data.type === 'http' && (
								<HttpForm data={data} setData={setData} />
							)}
							{data.type === 'sqlServer' && (
								<SqlForm data={data} setData={setData} />
							)}
							{data.type === 'tcp' && <TcpForm data={data} setData={setData} />}
						</div>
					</div>
					<DialogFooter className="sm:justify-between md:justify-end">
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
									setOpen(false);
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
										{
											_action: 'test',
											...JSON.parse(
												JSON.stringify(data, (_k, v) => v ?? undefined),
											),
										},
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
										{
											_action: 'new',
											...JSON.parse(
												JSON.stringify(data, (_k, v) => v ?? undefined),
											),
										},
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
