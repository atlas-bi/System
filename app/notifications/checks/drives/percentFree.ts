import { setDrivePercFreeSentAt } from '~/models/monitor.server';
import type { Drive, Monitor } from '~/models/monitor.server';
import { Logger } from '~/notifications/logger';
import { sendNotification } from '~/notifications/notifier';

async function allClear({
	monitor,
	drive,
}: {
	monitor: Monitor;
	drive: Drive;
}) {
	if (drive.percFreeNotifySentAt) {
		// send an all clear alert
		const subject = `💚 [${monitor.host} ${drive.name}:\\] Free space now below limit.`;
		const message = `All Clear: free space now below limit on ${monitor.host} ${drive.name}:\\.`;

		drive.percFreeNotifyTypes.map(async (notification: Notification) => {
			try {
				return sendNotification({ notification, subject, message });
			} catch (e) {
				return Logger({
					message: `Failed to send ${notification.name}: ${e}`,
					type: 'error',
					monitor,
					drive,
				});
			}
		});

		return Logger({
			message: `Free space now below limit of ${drive.percFreeValue}%`,
			type: 'success',
			monitor,
			drive,
		});
	}
}

async function reset({ drive }: { drive: Drive }) {
	return setDrivePercFreeSentAt({
		id: drive.id,
		percFreeNotifySentAt: null,
	});
}

export default async function percentFreeNotifier({
	drive,
	monitor,
}: {
	drive: Drive;
	monitor: Monitor;
}) {
	// don't notify if disabled.
	if (!drive.percFreeNotify) return reset({ drive });

	// calculate % free.
	const percFree = (Number(drive.usage[0].free) / Number(drive.size)) * 100;

	// don't send if there is no error.
	if (percFree > drive.percFreeValue) {
		await allClear({ monitor, drive });
		return reset({ drive });
	}

	const message = `Percentage of free space (${Math.round(
		percFree,
	)}%) is less than limit of ${drive.percFreeValue}%`;

	await Logger({
		message,
		type: 'error',
		monitor,
		drive,
	});

	let resend = false;

	if (
		drive.percFreeNotifyResendAfterMinutes &&
		drive.percFreeNotifyResendAfterMinutes > 0
	) {
		const diff = +new Date() - +new Date(drive.percFreeNotifySentAt);

		resend =
			Math.round(diff / 1000 / 60) > drive.percFreeNotifyResendAfterMinutes;
	}

	if (resend && drive.percFreeNotifyTypes) {
		const subject = `💔 [${monitor.host} ${drive.name}:\\] Alert: free space limit exceeded on `;
		const message = `Alert: free space limit exceeded on ${monitor.host} drive ${drive.name}`;

		drive.percFreeNotifyTypes.map(async (notification: Notification) => {
			try {
				return sendNotification({ notification, subject, message });
			} catch (e) {
				return Logger({
					message: `Failed to send ${notification.name}: ${e}`,
					type: 'error',
					monitor,
					drive,
				});
			}
		});

		return setDrivePercFreeSentAt({
			id: drive.id,
			percFreeNotifySentAt: new Date(),
		});
	}
}
