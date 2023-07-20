import { differenceInMinutes } from 'date-fns';
import { Monitor, setMonitorRebootSentAt } from '~/models/monitor.server';
import { Logger } from '~/notifications/logger';
import { sendNotification } from '~/notifications/notifier';

export default async function rebootNotifier({
	monitor,
}: {
	monitor: Monitor;
}) {
	// don't notify if disabled.
	if (!monitor.rebootNotify) return;

	if (monitor.lastBootTime && isDate(monitor.lastBootTime)) {
		const subject = `[${monitor.host}] Rebooted.`;
		const message = `[${monitor.host}] Rebooted.`;

		if (
			!monitor.rebootNotifySentAt &&
			differenceInMinutes(monitor.lastBootTime, new Date()) < 5
		) {
			// notification was never sent before. Only send if the server did actually reboot in the
			// last few minutes
		} else if (
			new Date(monitor.rebootNotifySentAt) < new Date(monitor.lastBootTime)
		) {
			// send if it has rebooted since last send

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
}
