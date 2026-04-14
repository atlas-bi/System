import { setMonitorRebootSentAt } from '~/models/monitor.server';
import type { MonitorWithRelations } from '~/models/monitor.server';
import type { NotificationMeta } from '~/models/notification.server';
import { Logger } from '~/notifications/logger';
import { sendNotification } from '~/notifications/notifier';
import { SuccessEmail } from '~/notifications/email/monitors/reboot';
import { render } from '@react-email/render';

export default async function rebootNotifier({
	monitor,
	oldMonitor,
}: {
	monitor: MonitorWithRelations;
	oldMonitor: MonitorWithRelations;
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

		monitor.rebootNotifyTypes.map(async (notification: NotificationMeta) => {
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
