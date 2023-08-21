import {
	Monitor,
	setMonitorRebootSentAt,
	getMonitorBootTime,
} from '~/models/monitor.server';
import { Logger } from '~/notifications/logger';
import { sendNotification } from '~/notifications/notifier';

export default async function rebootNotifier({
	monitor,
	oldMonitor,
}: {
	monitor: Monitor;
	oldMonitor: Monitor;
}) {
	// don't notify if disabled.
	if (!monitor.rebootNotify) return;

	// send notification if it has changed
	if (monitor.lastBootTime != oldMonitor.lastBootTime) {
		const subject = `⏰ [${monitor.host}] Reboot time changed.`;
		const message = `[${monitor.host}] Reboot time changed.`;

		monitor.rebootNotifyTypes.map(async (notification: Notification) => {
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
