import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Dispatch } from "react";

import type { Notification } from "~/models/notification.server";

export function DiscordForm({
	data,
	setData,
}: {
	data: Partial<Notification>;
	setData: Dispatch<Partial<Notification>>;
}) {
	return (
		<>
			<Label htmlFor="discordWebhookUrl" className="text-right self-start pt-3">
				Webhook URL*
			</Label>
			<div className="flex flex-col col-span-3">
				<Input
					type="password"
					id="discordWebhookUrl"
					placeholder="https://discord.com/api/webhooks/..."
					value={data.discordWebhookUrl || ""}
					onChange={(e) =>
						setData({ ...data, discordWebhookUrl: e.target.value })
					}
				/>
				<small className="text-muted-foreground">
					Create one in Discord under the channel's Settings, then Integrations,
					then Webhooks. Each webhook posts to a single channel.
				</small>
			</div>
		</>
	);
}
