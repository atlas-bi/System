import { Monitor, getMonitor } from '~/models/monitor.server';
import { getDriveLatestFeed } from '~/models/drive.server';
import type { Drive } from '~/models/drive.server';
import SMTP from './smtp';
import Telegram from './telegram';
import {
	Notification,
	getNotificationConnection,
} from '~/models/notification.server';
import percentFreeNotifier from './checks/drives/percentFree';
import rebootNotifier from './checks/monitors/reboot';
import collectionNotifier from './checks/monitors/collection';
import httpCertNotifier from './checks/monitors/httpCert';
import sqlFilePercentFreeNotifier from './checks/monitors/sqlFiles';

// 1. send error notification
// 2. when error clears send an "all clear"

// message is only included for monitor failures like server offline etc.
export default async function Notifier({
	job,
	message,
	oldMonitor,
}: {
	job: string;
	message?: string;
	oldMonitor?: Monitor;
}) {
	const monitor = await getMonitor({ id: job });

	if (!monitor) return;

	await collectionNotifier({ monitor, message });
	await httpCertNotifier({ monitor });
	await sqlFilePercentFreeNotifier({ monitor });

	if (monitor.type === 'windows' || monitor.type === 'ubuntu') {
		// reboot notifier
		if (oldMonitor) await rebootNotifier({ monitor, oldMonitor });

		// drive notifications
		monitor?.drives?.map(async (drive: Drive) => {
			// don't report inactive drives.
			if (drive.enabled == false) return;

			const usage = await getDriveLatestFeed({ id: drive.id });
			// drive has no usages, ignore.
			if (!usage) return;

			if (drive.missingNotify) {
				// notify if drive was missing
			}

			await percentFreeNotifier({ drive, monitor, usage });

			if (drive.sizeFreeNotify) {
			}

			if (drive.growthRateNotify) {
			}
		});
	}
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
	const meta = await getNotificationConnection({ id: notification.id });
	if (!meta) return;

	if (meta.type == 'smtp') {
		return SMTP({ notification: meta, subject, message });
	} else if (meta.type == 'telegram') {
		return Telegram({ notification: meta, message: subject });
	}
};
