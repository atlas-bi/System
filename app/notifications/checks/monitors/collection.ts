import { Monitor, setMonitorConnectionSentAt } from '~/models/monitor.server';
import { Logger } from '~/notifications/logger';
import { sendNotification } from '~/notifications/notifier';
export default async function collectionNotifier({
	monitor,
	message,
}: {
	monitor: Monitor;
	message?: string;
}) {
	async function reset({ monitor }: { monitor: Monitor }) {
		return setMonitorConnectionSentAt({
			id: monitor.id,
			connectionNotifySentAt: null,
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
			const message = `Data collection restored on ${name}.`;

			monitor.connectionNotifyTypes.map(async (notification: Notification) => {
				try {
					return sendNotification({ notification, subject, message });
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
		return setMonitorConnectionSentAt({
			id: monitor.id,
			connectionNotifySentAt: null,
		});
	}

	Logger({ message, type: 'error', monitor });

	let resend = !monitor.connectionNotifySentAt;

	if (
		monitor.connectionNotifyResendAfterMinutes &&
		monitor.connectionNotifyResendAfterMinutes > 0
	) {
		const diff = +new Date() - +new Date(monitor.connectionNotifySentAt);

		resend =
			Math.round(diff / 1000 / 60) > monitor.connectionNotifyResendAfterMinutes;
	}

	if (resend && monitor.connectionNotifyTypes) {
		const subject = `💔 [${name}] Data collection failed. ${message?.substring(
			0,
			20,
		)}`;
		const errorMessage = `Alert: data collection failed on ${name}.\n ${message}`;

		monitor.connectionNotifyTypes.map(async (notification: Notification) => {
			console.log('sending!', notification);
			try {
				return await sendNotification({
					notification,
					subject,
					message: errorMessage,
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
}
