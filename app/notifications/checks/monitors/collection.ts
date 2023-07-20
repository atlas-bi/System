import { Monitor, setMonitorConnectionSentAt } from '~/models/monitor.server';
import { Logger } from '~/notifications/logger';
import { sendNotification } from '~/notifications/notifier';
export default async function percentFreeNotifier({
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

	if (!message) {
		if (monitor.connectionNotifySentAt && monitor.connectionNotify) {
			await reset({ monitor });
			const subject = `💚 [${monitor.host}] Data collection restored.`;
			const message = `Data collection restored on ${monitor.host}.`;

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
		return;
	}

	Logger({ message, type: 'error', monitor });

	let resend = false;

	if (
		monitor.connectionNotifyResendAfterMinutes &&
		monitor.connectionNotifyResendAfterMinutes > 0
	) {
		const diff = +new Date() - +new Date(monitor.connectionNotifySentAt);

		resend =
			Math.round(diff / 1000 / 60) > monitor.connectionNotifyResendAfterMinutes;
	}

	if (resend && monitor.connectionNotifyTypes) {
		const subject = `💔 [${monitor.host}] Data collection failed.`;
		const errorMessage = `Alert: data collection failed on ${monitor.host}.\n ${message}`;

		monitor.connectionNotifyTypes.map(async (notification: Notification) => {
			try {
				return sendNotification({
					notification,
					subject,
					message: errorMessage,
				});
			} catch (e) {
				return Logger({
					message: `Failed to send ${notification.name}: ${e}`,
					type: 'error',
					monitor,
					drive,
				});
			}
		});

		return setMonitorConnectionSentAt({
			id: monitor.id,
			connectionNotifySentAt: new Date(),
		});
	}
}
