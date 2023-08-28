import { Dispatch } from 'react';

import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

import { Textarea } from '~/components/ui/textarea';
import type { Monitor } from '~/models/monitor.server';

export default function TcpForm({
	data,
	setData,
}: {
	data: Monitor;
	setData: Dispatch<Monitor>;
}) {
	return (
		<>
			<Label htmlFor="host" className="text-right">
				Host*
			</Label>
			<Input
				type="text"
				id="host"
				value={data.host || ''}
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
		</>
	);
}
