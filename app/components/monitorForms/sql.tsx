import { Dispatch } from 'react';

import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

import type { Notification } from '~/models/notification.server';

export default function SqlForm({
	data,
	setData,
}: {
	data: Notification;
	setData: Dispatch<Notification>;
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
		</>
	);
}
