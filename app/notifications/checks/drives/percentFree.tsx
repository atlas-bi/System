import { DriveUsage, setDrivePercFreeSentAt } from '~/models/monitor.server';
import type { Drive, Monitor } from '~/models/monitor.server';
import type { Notification } from '~/models/notification.server';
import { Logger } from '~/notifications/logger';
import { sendNotification } from '~/notifications/notifier';
import { render } from '@react-email/render';

import {
	ErrorEmail,
	SuccessEmail,
} from '~/notifications/email/drives/percentFree';

async function allClear({
	monitor,
	drive,
}: {
	monitor: Monitor;
	drive: Drive & { percFreeNotifyTypes: Notification[] };
}) {
	if (drive.percFreeNotifySentAt) {
		// send an all clear alert
		const subject = `💚 [${monitor.host} ${drive.name}:\\] Free space now below limit.`;

		const html = render(
			<SuccessEmail
				subject={subject}
				hostname={process.env.HOSTNAME}
				monitor={monitor}
			/>,
			{
				pretty: false,
			},
		);

		drive.percFreeNotifyTypes.map(async (notification: Notification) => {
			try {
				return await sendNotification({ notification, subject, message: html });
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
	drive: Drive & { usage: DriveUsage[]; percFreeNotifyTypes: Notification[] };
	monitor: Monitor;
}) {
	// don't notify if disabled.
	if (!drive.percFreeNotify) return reset({ drive });

	// calculate % free.
	const percFree = (Number(drive.usage[0].free) / Number(drive.size)) * 100;

	// don't send if there is no error.
	if (percFree > (drive.percFreeValue || 0)) {
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

	let resend = !drive.percFreeNotifySentAt;

	if (
		drive.percFreeNotifySentAt !== null &&
		drive.percFreeNotifyResendAfterMinutes &&
		drive.percFreeNotifyResendAfterMinutes > 0
	) {
		const diff = Date.now() - +new Date(drive.percFreeNotifySentAt);

		// allow nearly 2 mins off
		resend =
			Math.round(diff / 1000 / 60) + 0.8 >
			drive.percFreeNotifyResendAfterMinutes;
	}

	if (resend && drive.percFreeNotifyTypes) {
		const subject = `💔 [${monitor.host} ${drive.name}:\\] Alert: free space limit exceeded on `;
		const html = render(
			<ErrorEmail
				hostname={process.env.HOSTNAME}
				monitor={monitor}
				message={message}
			/>,
			{
				pretty: false,
			},
		);

		drive.percFreeNotifyTypes.map(async (notification: Notification) => {
			try {
				// await to prevent error from bubbling
				return await sendNotification({ notification, subject, message: html });
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
