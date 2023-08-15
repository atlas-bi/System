import {
	Monitor,
	setMonitorRebootSentAt,
	getMonitorBootTime,
} from '~/models/monitor.server';
import { Logger } from '~/notifications/logger';
import { sendNotification } from '~/notifications/notifier';

export default async function rebootNotifier({
	monitor,
}: {
	monitor: Monitor;
}) {
	// don't notify if disabled.
	if (!monitor.rebootNotify) return;

	// get last reboot time
	const lastBootTime = await getMonitorBootTime({ id: monitor.id });

	// if new , update time and skip notification
	if (!monitor.rebootNotifySentAt) {
		return setMonitorRebootSentAt({
			id: monitor.id,
			rebootNotifySentAt: new Date(),
		});
	}

	if (monitor.lastBootTime != lastBootTime) {
		const subject = `[${monitor.host}] Rebooted.`;
		const message = `[${monitor.host}] Rebooted.`;

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
