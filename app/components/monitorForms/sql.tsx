import { Dispatch } from 'react';

import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

import type { Monitor } from '~/models/monitor.server';
import { Switch } from '../ui/switch';

export default function SqlForm({
	data,
	setData,
}: {
	data: Monitor;
	setData: Dispatch<Monitor>;
}) {
	return (
		<>
			<Label htmlFor="host" className="text-right">
				Connection String*
			</Label>
			<Input
				type="text"
				id="host"
				value={data.sqlConnectionString || ''}
				placeholder={`${
					data.type === 'sqlServer'
						? 'SERVER=server_name;DATABASE=database_name;UID=username;PWD=password;TrustServerCertificate=Yes'
						: 'server1'
				}`}
				className="col-span-3"
				onChange={(e) =>
					setData({ ...data, sqlConnectionString: e.target.value })
				}
			/>
			<Label className="text-right">Disable Database Memory Check</Label>
			<div className="self-start col-span-3 flex space-x-2">
				<Switch
					name="sqlDisableDbMemory"
					checked={data.sqlDisableDbMemory || false}
					onCheckedChange={(sqlDisableDbMemory) =>
						setData({ ...data, sqlDisableDbMemory })
					}
				/>
				<small className="my-auto text-muted-secondary">
					Database memory query is expensive on large servers.
				</small>
			</div>
		</>
	);
}
