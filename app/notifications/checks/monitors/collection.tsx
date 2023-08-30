import {
	Monitor,
	setMonitorConnectionRetried,
	setMonitorConnectionSentAt,
} from '~/models/monitor.server';
import { Logger } from '~/notifications/logger';
import { sendNotification } from '~/notifications/notifier';
import { render } from '@react-email/render';

import {
	ErrorEmail,
	SuccessEmail,
} from '~/notifications/email/monitors/collection';

export default async function collectionNotifier({
	monitor,
	message,
}: {
	monitor: Monitor & { connectionNotifyTypes: Notification[] };
	message?: string;
}) {
	async function reset({ monitor }: { monitor: Monitor }) {
		await setMonitorConnectionSentAt({
			id: monitor.id,
			connectionNotifySentAt: null,
		});

		return setMonitorConnectionRetried({
			id: monitor.id,
			connectionNotifyRetried: null,
		});
	}

	// no reporting if disabled.
	if (monitor.connectionNotify == false) return;

	const name =
		monitor.type === 'windows' || monitor.type === 'ubuntu'
			? `${monitor.title} (${monitor.host})`
			: `${monitor.title} (${monitor.httpUrl})`;

	if (!message) {
		if (monitor.connectionNotifySentAt && monitor.connectionNotify) {
			await reset({ monitor });
			const subject = `💚 [${name}] Data collection restored.`;
			const html = render(
				<SuccessEmail
					hostname={process.env.HOSTNAME}
					subject={subject}
					monitor={monitor}
				/>,
				{
					pretty: false,
				},
			);

			monitor.connectionNotifyTypes.map(async (notification: Notification) => {
				try {
					return await sendNotification({
						notification,
						subject,
						message: html,
					});
				} catch (e) {
					return Logger({
						message: `Failed to send ${notification.name}: ${e}`,
						type: 'error',
						monitor,
					});
				}
			});
			return Logger({
				message: `Data collection restored.`,
				type: 'success',
				monitor,
			});
		}

		// reset notification
		return reset({
			monitor,
		});
	}

	await Logger({ message, type: 'error', monitor });

	let resend = !monitor.connectionNotifySentAt;

	if (
		monitor.connectionNotifySentAt !== null &&
		monitor.connectionNotifyResendAfterMinutes &&
		monitor.connectionNotifyResendAfterMinutes > 0
	) {
		const diff = Date.now() - +new Date(monitor.connectionNotifySentAt);

		// allow nearly 2 mins off
		resend =
			Math.round(diff / 1000 / 60) + 0.8 >
			monitor.connectionNotifyResendAfterMinutes;
	}

	// only send if we have reached the retry count.
	if (
		resend &&
		monitor.connectionNotifyTypes &&
		(!monitor.connectionNotifyRetries ||
			monitor.connectionNotifyRetries <= (monitor.connectionNotifyRetried || 0))
	) {
		const subject = `💔 [${name}] Data collection failed. ${message?.substring(
			0,
			20,
		)}`;
		const html = render(
			<ErrorEmail
				hostname={process.env.HOSTNAME}
				monitor={monitor}
				message={message}
			/>,
			{
				pretty: false,
			},
		);

		monitor.connectionNotifyTypes.map(async (notification: Notification) => {
			try {
				return await sendNotification({
					notification,
					subject,
					message: html,
				});
			} catch (e) {
				console.log('failed to send!');
				return Logger({
					message: `Failed to send ${notification.name}: ${e}`,
					type: 'error',
					monitor,
				});
			}
		});

		return setMonitorConnectionSentAt({
			id: monitor.id,
			connectionNotifySentAt: new Date(),
		});
	}

	// increment try value only if we are still checking it.
	if (monitor.connectionNotifyRetried <= monitor.connectionNotifyRetries) {
		return setMonitorConnectionRetried({
			id: monitor.id,
			connectionNotifyRetried: (monitor.connectionNotifyRetried || 0) + 1,
		});
	}
	return;
}
