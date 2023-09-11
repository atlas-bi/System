import { Form, useFetcher } from '@remix-run/react';
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

import { Textarea } from '~/components/ui/textarea';

import type { Drive } from '~/models/drive.server';
import { Switch } from '../ui/switch';

export default function Drive({
	drive,
	children,
}: {
	drive: Drive;
	children: ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const fetcher = useFetcher();

	const [data, setData] = useState<Drive>(drive);

	useEffect(() => setData(drive), [drive]);

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.drive != null) {
			setOpen(false);
		}
	}, [fetcher]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:min-w-[425px] sm:max-w-fit">
				<DialogHeader>
					<DialogTitle>{drive.name}</DialogTitle>
					<DialogDescription>Editing drive.</DialogDescription>
				</DialogHeader>
				{fetcher.state !== 'submitting' && fetcher.data?.form?.error ? (
					<small className="text-red-700">{fetcher.data.form.error}</small>
				) : null}
				<Form method="post" action="/drive/edit">
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label className="text-right">Enabled</Label>
							<div className="self-start col-span-3">
								<Switch
									name="enabled"
									checked={data.enabled}
									onCheckedChange={(enabled) => setData({ ...data, enabled })}
								/>
							</div>
							<Label htmlFor="name" className="text-right">
								Name
							</Label>
							<Input
								type="text"
								id="name"
								value={data.title || ''}
								placeholder="Logs drive"
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
						</div>
					</div>
					<DialogFooter className="sm:justify-between md:justify-end">
						<div className="flex space-x-2">
							<Button
								type="button"
								onClick={(e) => {
									fetcher.submit(
										{ _action: 'edit', ...data },
										{ method: 'post', action: '/drive/edit' },
									);
								}}
							>
								Save
							</Button>
						</div>
						<div className="flex space-x-2">
							<Button
								type="button"
								variant="outline"
								className="border-red-300"
								onClick={(e) => {
									fetcher.submit(
										{ _action: 'delete', id: data.id },
										{ method: 'post', action: '/drive/edit' },
									);
								}}
							>
								Delete
							</Button>
						</div>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
