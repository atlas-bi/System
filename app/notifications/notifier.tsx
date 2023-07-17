import {
	getMonitor,
	monitorLog,
	setDrivePercFreeSentAt,
	driveLog,
	getLatestMonitorErrorLog,
} from '~/models/monitor.server';
import type { Drive, DriveUsage } from '~/models/monitor.server';
import SMTP from './smtp';
import Telegram from './telegram';
import type { Notification } from '~/models/notification.server';
import percentFreeNotifier from './checks/drives/percentFree';

export default async function Notifier({ job }: { job: string }) {
	const monitor = await getMonitor({ id: job });

	// drive notifications

	monitor?.drives?.map(async (drive: Drive & { usage: DriveUsage[] }) => {
		// don't report inactive drives.
		if (drive.inactive) return;

		// drive has no usages, ignore.
		if (drive.usage.length <= 0) return;

		if (drive.missingNotify) {
			// notify if drive was missing
		}

		await percentFreeNotifier({ drive, monitor });

		if (drive.sizeFreeNotify) {
		}

		if (drive.growthRateNotify) {
		}
	});
}

export const sendNotification = async ({
	notification,
	subject,
	message,
}: {
	notification: Notification;
	subject: string;
	message: string;
}) => {
	if (notification.type == 'smtp') {
		await SMTP({ notification, subject, message });
	} else if (notification.type == 'telegram') {
		await Telegram({ notification, message: subject });
	}
};
