import type { Notification } from '~/models/notification.server';
import axios from 'axios';
import { decrypt } from '@/lib/utils';

export default async function Telegram({
	notification,
	message,
	test,
}: {
	notification: Notification;
	message: string;
	test?: Boolean;
}) {
	try {
		let params = {
			chat_id: notification.tgChatId,
			text: message,
			disable_notification: notification.tgSendSilently ?? false,
			protect_content: notification.tgProtectMessage ?? false,
			message_thread_id: notification.tgThreadId || undefined,
		};

		await axios.get(
			`https://api.telegram.org/bot${
				test ? notification.tgBotToken : decrypt(notification.tgBotToken)
			}/sendMessage`,
			{
				params: params,
			},
		);
	} catch (error) {
		if (error?.response?.data?.description) {
			throw new Error(error.response.data.description);
		} else {
			throw new Error(error.message);
		}
	}
}
