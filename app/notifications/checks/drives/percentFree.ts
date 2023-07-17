import {
	getLatestMonitorErrorLog,
	monitorLog,
	setDrivePercFreeSentAt,
} from '~/models/monitor.server';
import type { Drive, Monitor } from '~/models/monitor.server';

import { sendNotification } from '~/notifications/notifier';

async function reset({ drive }: { drive: Drive }) {
	return await setDrivePercFreeSentAt({
		id: drive.id,
		percFreeNotifySentAt: undefined,
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
	if (!drive.percFreeNotify) return await reset({ drive });

	// calculate % free.
	const percFree = (Number(drive.usage[0].free) / Number(drive.size)) * 100;

	// don't send if there is no error.
	if (percFree > drive.percFreeValue) return await reset({ drive });

	// get last monitor log and check date.
	const lastLog = await getLatestMonitorErrorLog({
		monitorId: monitor.id,
		driveId: drive.id,
	});

	const message = `Percentage of free space (${Math.round(
		percFree,
	)}%) is less than limit of ${drive.percFreeValue}`;

	// add log if not already there.
	if (message !== lastLog?.message) {
		await monitorLog({
			driveId: drive.id,
			monitorId: monitor.id,
			type: 'error',
			message,
		});
	}

	let resend = true;

	if (
		drive.percFreeNotifyResendAfterMinutes &&
		drive.percFreeNotifyResendAfterMinutes > 0
	) {
		const diff = +new Date() - +new Date(drive.percFreeNotifySentAt);

		resend =
			Math.round(diff / 1000 / 60) > drive.percFreeNotifyResendAfterMinutes;
	}

	if (resend && drive.percFreeNotifyTypes) {
		const subject = `Alert: free space limit exceeded on ${monitor.host} ${drive.name}`;
		const message = `Alert: free space limit exceeded on ${monitor.host} ${drive.name}`;

		drive.percFreeNotifyTypes.map(
			async (notification: Notification) =>
				await sendNotification({ notification, subject, message }),
		);

		await setDrivePercFreeSentAt({
			id: drive.id,
			percFreeNotifySentAt: new Date(),
		});
	} else {
		// reset the notification time
		return await reset({ drive });
	}
}
