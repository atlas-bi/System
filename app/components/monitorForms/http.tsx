import { Dispatch } from 'react';

import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

import { Textarea } from '~/components/ui/textarea';

import type { Monitor } from '~/models/monitor.server';
import { Switch } from '../ui/switch';
import { statusCodes } from '~/models/statusCodes';
import { MultiSelect } from '../ui/multiselect';
import { requestMethods } from '~/models/requestMethods';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select';
import { encodingTypes } from '~/models/encodingTypes';
import { authTypes } from '~/models/authTypes';
import { jsonParser } from '~/utils';

export default function HttpForm({
	data,
	setData,
}: {
	data: Monitor;
	setData: Dispatch<Monitor>;
}) {
	return (
		<>
			<Label htmlFor="httpUrl" className="text-right">
				Url*
			</Label>
			<Input
				type="text"
				id="httpUrl"
				value={data.httpUrl || ''}
				placeholder="https://google.com"
				className="col-span-3"
				onChange={(e) => setData({ ...data, httpUrl: e.target.value })}
			/>
			<Label className="text-right">Ignore TLS/SSL errors</Label>
			<div className="self-start col-span-3">
				<Switch
					name="httpIgnoreSsl"
					checked={data.httpIgnoreSsl || false}
					onCheckedChange={(httpIgnoreSsl) =>
						setData({ ...data, httpIgnoreSsl })
					}
				/>
			</div>
			{data.httpUrl && data.httpUrl.startsWith('https') && (
				<>
					<Label className="text-right">Cert Expiration Warning</Label>
					<div className="self-start col-span-3">
						<Switch
							name="httpCheckCert"
							checked={data.httpCheckCert || false}
							onCheckedChange={(httpCheckCert) =>
								setData({ ...data, httpCheckCert })
							}
						/>
					</div>
				</>
			)}
			{/*- Upside down (should be off)*/}
			<Label className="text-right">Accepted status codes</Label>
			<MultiSelect
				label={null}
				placeholder="choose"
				parentClassName="col-span-3"
				data={statusCodes}
				active={statusCodes.filter((x: { value: string }) => {
					const codes = jsonParser(data.httpAcceptedStatusCodes);
					if (!codes) return false;
					if (typeof codes === 'string' || typeof codes === 'number') {
						return codes.toString() === x.value;
					}
					return (
						codes.filter((t: string | number) => t.toString() == x.value)
							.length > 0
					);
				})}
				name="httpAcceptedStatusCodes"
				onChange={(x) => {
					setData({
						...data,
						httpAcceptedStatusCodes: JSON.stringify(x.map((x) => x.value)),
					});
				}}
			/>

			<Label htmlFor="httpMaxRedirects" className="text-right">
				Max Redirects
			</Label>
			<Input
				type="number"
				id="httpMaxRedirects"
				value={data.httpMaxRedirects}
				placeholder="10"
				className="col-span-3"
				onChange={(e) =>
					setData({ ...data, httpMaxRedirects: Number(e.target.value) })
				}
			/>

			<Select
				onValueChange={(httpRequestMethod: string) =>
					setData({ ...data, httpRequestMethod })
				}
				value={data.httpRequestMethod}
				defaultValue="GET"
			>
				<Label htmlFor="name" className="text-right">
					Request Method
				</Label>
				<SelectTrigger className="col-span-3">
					<SelectValue placeholder="select one" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{requestMethods.map((type) => (
							<SelectItem key={type.value} value={type.value}>
								{type.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>

			<Select
				onValueChange={(httpBodyEncoding: string) =>
					setData({ ...data, httpBodyEncoding })
				}
				value={data.httpBodyEncoding}
			>
				<Label htmlFor="name" className="text-right">
					Body Encoding
				</Label>
				<SelectTrigger className="col-span-3">
					<SelectValue placeholder="select one" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{encodingTypes.map((type) => (
							<SelectItem key={type.value} value={type.value}>
								{type.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			<Label htmlFor="httpBodyText" className="text-right">
				Body Text
			</Label>
			<Textarea
				id="httpBodyText"
				value={data.httpBodyText || ''}
				placeholder=""
				className="col-span-3"
				onChange={(e) => setData({ ...data, httpBodyText: e.target.value })}
			/>
			<Label htmlFor="httpHeaderText" className="text-right">
				Header Text
			</Label>
			<Textarea
				id="httpHeaderText"
				value={data.httpHeaderText || ''}
				placeholder=""
				className="col-span-3"
				onChange={(e) => setData({ ...data, httpHeaderText: e.target.value })}
			/>

			<Select
				onValueChange={(httpAuthentication: string) =>
					setData({ ...data, httpAuthentication })
				}
				value={data.httpAuthentication}
			>
				<Label htmlFor="name" className="text-right">
					Authentication Method
				</Label>
				<SelectTrigger className="col-span-3">
					<SelectValue placeholder="select one" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{authTypes.map((type) => (
							<SelectItem key={type.value} value={type.value}>
								{type.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>

			{(data.httpAuthentication === 'basic' ||
				data.httpAuthentication === 'ntlm') && (
				<>
					<Label htmlFor="httpUsername" className="text-right">
						Username
					</Label>
					<Input
						type="text"
						id="httpUsername"
						value={data.httpUsername || ''}
						placeholder="john-smith"
						className="col-span-3"
						onChange={(e) => setData({ ...data, httpUsername: e.target.value })}
					/>
					<Label htmlFor="httpPassword" className="text-right">
						Password
					</Label>
					<Input
						type="password"
						id="httpPassword"
						value={data.httpPassword || ''}
						placeholder="123"
						className="col-span-3"
						onChange={(e) => setData({ ...data, httpPassword: e.target.value })}
					/>
				</>
			)}

			{data.httpAuthentication === 'ntlm' && (
				<>
					<Label htmlFor="httpDomain" className="text-right">
						Domain
					</Label>
					<Input
						type="text"
						id="httpDomain"
						value={data.httpDomain || ''}
						placeholder="WORKGROUP"
						className="col-span-3"
						onChange={(e) => setData({ ...data, httpDomain: e.target.value })}
					/>
					<Label htmlFor="httpWorkstation" className="text-right">
						Workstation
					</Label>
					<Input
						type="text"
						id="httpWorkstation"
						value={data.httpWorkstation || ''}
						placeholder="ws103"
						className="col-span-3"
						onChange={(e) =>
							setData({ ...data, httpWorkstation: e.target.value })
						}
					/>
				</>
			)}
		</>
	);
}
