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

import { Checkbox } from '~/components/ui/checkbox';
import { Notification } from '~/models/notification.server';

import { Dispatch } from 'react';

export function SmtpForm({
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
				value={data.smtpHost || ''}
				placeholder="smpt.example.com"
				className="col-span-3"
				onChange={(e) => setData({ ...data, smtpHost: e.target.value })}
			/>
			<Label htmlFor="port" className="text-right">
				Port*
			</Label>
			<Input
				type="number"
				value={data.smtpPort}
				id="port"
				placeholder="22"
				className="col-span-3"
				onChange={(e) => setData({ ...data, smtpPort: Number(e.target.value) })}
			/>

			<Select
				onValueChange={(smtpSecurity: string) =>
					setData({ ...data, smtpSecurity })
				}
				defaultValue={data.smtpSecurity}
			>
				<Label htmlFor="name" className="text-right">
					Security*
				</Label>

				<SelectTrigger className="col-span-3">
					<SelectValue placeholder="Select a security type" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectItem value="none">None / STARTTLS (25, 587)</SelectItem>
						<SelectItem value="tls">TLS (465)</SelectItem>
					</SelectGroup>
				</SelectContent>
			</Select>

			<span></span>
			<div className="flex items-center space-x-2 col-span-3">
				<Checkbox
					id="ssl_errors"
					defaultChecked={data.ignoreSSLErrors || false}
					onCheckedChange={(checked) =>
						setData({ ...data, ignoreSSLErrors: checked })
					}
				/>
				<label
					htmlFor="ssl_errors"
					className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					Ignore SSL errors?
				</label>
			</div>

			<Label htmlFor="search_username" className="text-right">
				Username
			</Label>
			<Input
				type="text"
				id="search_username"
				value={data.smtpUsername || ''}
				placeholder="username"
				className="col-span-3"
				onChange={(e) => setData({ ...data, smtpUsername: e.target.value })}
			/>
			<Label htmlFor="search_password" className="text-right">
				Password
			</Label>
			<Input
				type="password"
				id="search_password"
				value={data.smtpPassword || ''}
				placeholder="123"
				className="col-span-3"
				onChange={(e) => setData({ ...data, smtpPassword: e.target.value })}
			/>
			<Label htmlFor="fromName" className="text-right">
				From Name
			</Label>
			<Input
				type="text"
				id="fromName"
				value={data.smtpFromName || ''}
				placeholder="Analytics Dept."
				className="col-span-3"
				onChange={(e) => setData({ ...data, smtpFromName: e.target.value })}
			/>
			<Label htmlFor="fromName" className="text-right">
				From Email*
			</Label>
			<Input
				type="text"
				id="fromEmail"
				value={data.smtpFromEmail || ''}
				placeholder="me@example.com"
				className="col-span-3"
				onChange={(e) => setData({ ...data, smtpFromEmail: e.target.value })}
			/>
			<Label htmlFor="toEmail" className="text-right">
				To Email*
			</Label>
			<Input
				type="text"
				id="toEmail"
				value={data.smtpToEmail || ''}
				placeholder="you@example.com"
				className="col-span-3"
				onChange={(e) => setData({ ...data, smtpToEmail: e.target.value })}
			/>
		</>
	);
}
