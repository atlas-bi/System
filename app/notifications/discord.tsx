import type { Notification } from "~/models/notification.server";
import axios from "axios";
import { decrypt } from "@/lib/utils";

// Discord rejects webhook messages with more than 2000 characters of content.
const DISCORD_MAX_CONTENT_LENGTH = 2000;

export default async function Discord({
	notification,
	message,
	test,
}: {
	notification: Pick<Notification, "discordWebhookUrl">;
	message: string;
	test?: Boolean;
}) {
	try {
		const webhookUrl = (
			test
				? notification.discordWebhookUrl
				: notification.discordWebhookUrl
					? decrypt(notification.discordWebhookUrl)
					: undefined
		)?.trim();

		if (!webhookUrl) {
			throw new Error("Webhook URL is required.");
		}

		await axios.post(
			webhookUrl,
			{
				content: message.slice(0, DISCORD_MAX_CONTENT_LENGTH),
				// monitor output is untrusted text; never let it ping roles or everyone.
				allowed_mentions: { parse: [] },
			},
			{ headers: { "Content-Type": "application/json" } },
		);
	} catch (error) {
		if (error?.response?.data?.message) {
			throw new Error(error.response.data.message);
		} else {
			throw new Error(error.message);
		}
	}
}
