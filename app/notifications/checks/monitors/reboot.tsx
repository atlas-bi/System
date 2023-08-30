import { Monitor, setMonitorRebootSentAt } from '~/models/monitor.server';
import type { Notification } from '~/models/notification.server';
import { Logger } from '~/notifications/logger';
import { sendNotification } from '~/notifications/notifier';
import { SuccessEmail } from '~/notifications/email/monitors/reboot';
import { render } from '@react-email/render';

export default async function rebootNotifier({
	monitor,
	oldMonitor,
}: {
	monitor: Monitor & { rebootNotifyTypes: Notification[] };
	oldMonitor: Monitor;
}) {
	// don't notify if disabled.
	if (!monitor.rebootNotify) return;

	// send notification if it has changed
	if (monitor.lastBootTime != oldMonitor.lastBootTime) {
		const subject = `⏰ [${monitor.host}] Reboot time changed.`;
		const message = `[${monitor.host}] Reboot time changed.`;
		const html = render(
			<SuccessEmail hostname={process.env.HOSTNAME} monitor={monitor} />,
			{
				pretty: false,
			},
		);

		monitor.rebootNotifyTypes.map(async (notification: Notification) => {
			try {
				return await sendNotification({ notification, subject, message: html });
			} catch (e) {
				return Logger({
					message: `Failed to send ${notification.name}: ${e}`,
					type: 'error',
					monitor,
				});
			}
		});

		await Logger({
			message,
			type: 'warning',
			monitor,
		});

		return setMonitorRebootSentAt({
			id: monitor.id,
			rebootNotifySentAt: new Date(),
		});
	}
}
