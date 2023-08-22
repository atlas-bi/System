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

import type { Database } from '~/models/monitor.server';
import { Switch } from '../ui/switch';

export default function Database({
	database,
	children,
}: {
	database: Database;
	children: ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const fetcher = useFetcher();

	const [data, setData] = useState<Database>(database);

	useEffect(() => setData(database), [database]);

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.database != null) {
			setOpen(false);
		}
	}, [fetcher]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:min-w-[425px] sm:max-w-fit">
				<DialogHeader>
					<DialogTitle>{database.name}</DialogTitle>
					<DialogDescription>Editing database.</DialogDescription>
				</DialogHeader>
				{fetcher.state !== 'submitting' && fetcher.data?.form?.error ? (
					<small className="text-red-700">{fetcher.data.form.error}</small>
				) : null}
				<Form method="post" action="/monitor/new">
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
								placeholder="Logs database"
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
					<DialogFooter className="sm:justify-between">
						<div className="flex space-x-2">
							<Button
								type="button"
								onClick={(e) => {
									fetcher.submit(
										{
											_action: 'edit',
											...JSON.parse(
												JSON.stringify(data, (k, v) => v ?? undefined),
											),
										},
										{ method: 'post', action: '/database/edit' },
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
