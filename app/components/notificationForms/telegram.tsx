import { Checkbox } from '~/components/ui/checkbox';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Dispatch } from 'react';

import type { Notification } from '~/models/notification.server';

export function TelegramForm({
	data,
	setData,
}: {
	data: Notification;
	setData: Dispatch<Notification>;
}) {
	return (
		<>
			<Label htmlFor="tgBotToken" className="text-right  self-start pt-3">
				Bot Token*
			</Label>
			<div className="flex flex-col col-span-3">
				<Input
					type="password"
					id="tgBotToken"
					placeholder="123"
					value={data.tgBotToken || ''}
					onChange={(e) => setData({ ...data, tgBotToken: e.target.value })}
				/>
				<small className="text-muted-foreground">
					You can get a token from{' '}
					<a href="https://t.me/BotFather" target="_blank">
						https://t.me/BotFather
					</a>
					.
				</small>
			</div>
			<Label htmlFor="tgChatId" className="text-right self-start pt-3">
				Chat Id*
			</Label>
			<div className="flex flex-col col-span-3">
				<Input
					type="text"
					id="tgChatId"
					value={data.tgChatId || ''}
					placeholder="1AD32"
					onChange={(e) => setData({ ...data, tgChatId: e.target.value })}
				/>
				<small className="text-muted-foreground">
					Support Direct Chat / Group / Channel's Chat Id
					<br />
					Get chat ID by sending a message to the bot and going to
					https://api.telegram.org/bot(bot_id)/getUpdates to view the chat_id:
				</small>
			</div>
			<Label htmlFor="tgThreadId" className="text-right  self-start pt-3">
				Message Thread Id
			</Label>
			<div className="flex flex-col col-span-3">
				<Input
					type="text"
					id="tgThreadId"
					value={data.tgThreadId || ''}
					placeholder="tgThreadId"
					onChange={(e) => setData({ ...data, tgThreadId: e.target.value })}
				/>
				<small className="text-muted-foreground">
					Optional Unique identifier for the target message thread (topic) of
					the forum; for forum supergroups only
				</small>
			</div>

			<span></span>
			<div className="col-span-3">
				<div className="flex items-center space-x-2 ">
					<Checkbox
						id="tgSendSilently"
						onCheckedChange={(checked) =>
							setData({ ...data, tgSendSilently: checked === true })
						}
						defaultChecked={data.tgSendSilently || false}
					/>
					<label
						htmlFor="tgSendSilently"
						className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						Send Silently
					</label>
				</div>
				<small className="block text-muted-foreground">
					Sends the message silently. Users will receive a notification with no
					sound.
				</small>
			</div>

			<span></span>
			<div className="col-span-3">
				<div className="flex items-center space-x-2 ">
					<Checkbox
						id="ssl_errors"
						onCheckedChange={(checked) =>
							setData({ ...data, tgProtectMessage: checked === true })
						}
						defaultChecked={data.tgProtectMessage || false}
					/>
					<label
						htmlFor="ssl_errors"
						className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						Protect Forwarding/Saving
					</label>
				</div>
				<small className="block text-muted-foreground">
					If enabled, the bot messages in Telegram will be protected from
					forwarding and saving.
				</small>
			</div>
		</>
	);
}
