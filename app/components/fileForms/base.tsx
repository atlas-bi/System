import { Form, useFetcher } from '@remix-run/react';
import { Dispatch, ReactNode, useEffect, useState } from 'react';
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

import { Label } from '~/components/ui/label';
import type { DatabaseFile } from '~/models/monitor.server';
import { Switch } from '../ui/switch';

export default function File({
	file,
	setter,
	children,
}: {
	file: DatabaseFile;
	setter: Dispatch<DatabaseFile>;
	children: ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const fetcher = useFetcher();

	const [data, setData] = useState<DatabaseFile>(file);

	useEffect(() => setData(file), [file]);

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.file != null) {
			setOpen(false);
		}
	}, [fetcher]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:min-w-[425px] sm:max-w-fit">
				<DialogHeader>
					<DialogTitle>{file.fileName}</DialogTitle>
					<DialogDescription>Editing file.</DialogDescription>
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
										{ method: 'post', action: '/file/edit' },
									);
									setter(data);
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
