import { Dispatch } from 'react';

import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

import { Textarea } from '~/components/ui/textarea';

import type { Notification } from '~/models/notification.server';

export default function SshForm({
	data,
	setData,
}: {
	data: Notification;
	setData: Dispatch<Notification>;
}) {
	return (
		<>
			<Label htmlFor="host" className="text-right">
				Host*
			</Label>
			<Input
				type="text"
				id="host"
				value={data.host}
				placeholder="server1"
				className="col-span-3"
				onChange={(e) => setData({ ...data, host: e.target.value })}
			/>
			<Label htmlFor="port" className="text-right">
				Port*
			</Label>
			<Input
				type="number"
				id="port"
				value={data.port || 22}
				placeholder="22"
				className="col-span-3"
				onChange={(e) => setData({ ...data, port: Number(e.target.value) })}
			/>
			<Label htmlFor="username" className="text-right">
				Username*
			</Label>
			<Input
				type="text"
				id="username"
				placeholder="username"
				value={data.username}
				className="col-span-3"
				onChange={(e) => setData({ ...data, username: e.target.value })}
			/>
			<Label htmlFor="password" className="text-right">
				Password
			</Label>
			<Input
				type="password"
				id="password"
				value={data.password}
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
				value={data.privateKey || ''}
				onChange={(e) => setData({ ...data, privateKey: e.target.value })}
			/>
		</>
	);
}
