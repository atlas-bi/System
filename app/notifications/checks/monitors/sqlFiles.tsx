import {
	getFileUsageLatest,
	setFilePercFreeSentAt,
} from '~/models/monitor.server';
import type { MonitorWithRelations } from '~/models/monitor.server';
import type { NotificationMeta } from '~/models/notification.server';
import { Logger } from '~/notifications/logger';
import { sendNotification } from '~/notifications/notifier';
import { render } from '@react-email/render';

import {
	ErrorEmail,
	SuccessEmail,
} from '~/notifications/email/monitors/sqlFiles';

async function allClear({
	monitor,
	database,
	file,
}: {
	monitor: MonitorWithRelations;
	database: MonitorWithRelations['databases'][number];
	file: MonitorWithRelations['databases'][number]['files'][number];
}) {
	if (file.sqlFileSizePercentFreeNotifySentAt) {
		// send an all clear alert
		const subject = `💚 [${monitor.name}.${database.name} file ${file.fileName}] Free space now below limit.`;

		const html = render(
			<SuccessEmail
				subject={subject}
				hostname={process.env.HOSTNAME}
				monitor={monitor}
				database={database}
				file={file}
			/>,
			{
				pretty: false,
			},
		);

		monitor.sqlFileSizePercentFreeNotifyTypes.map(
			async (notification: NotificationMeta) => {
				try {
					return await sendNotification({
						notification,
						subject,
						message: html,
					});
				} catch (e) {
					return Logger({
						message: `Failed to send ${notification.name}: ${e}`,
						type: 'error',
						monitor,
						database,
						file,
					});
				}
			},
		);

		return Logger({
			message: `Free space now below limit of ${monitor.sqlFileSizePercentFreeValue}%`,
			type: 'success',
			monitor,
			file,
		});
	}
}

async function reset({ monitor }: { monitor: MonitorWithRelations }) {
	return monitor.databases?.map((x) =>
		x.files?.map(async (file) => resetFile({ file })),
	);
}
async function resetFile({
	file,
}: {
	file: MonitorWithRelations['databases'][number]['files'][number];
}) {
	return setFilePercFreeSentAt({
		id: file.id,
		sqlFileSizePercentFreeNotifySentAt: null,
	});
}

export default async function sqlFilePercentFreeNotifier({
	monitor,
}: {
	monitor: MonitorWithRelations;
}) {
	// only for sql
	if (monitor.type !== 'sqlServer') return;

	// if monitor is enabled
	// don't notify if disabled.
	if (!monitor.sqlFileSizePercentFreeNotify) return reset({ monitor });

	// run for database files.
	monitor.databases?.filter((database) =>
		database.files.map(async (file) => {
			// if the database or the file is disabled, reset and leave.
			// or if auto growth is enabled

			const usage = await getFileUsageLatest({ databaseFileId: file.id });

			if (
				!database.enabled ||
				!file.enabled ||
				(Number(file.growth) > 0 && Number(usage?.maxSize) == 0)
			) {
				return resetFile({ file });
			}

			// if there is no usage, return
			if (!usage) return;

			// calculate % free in file
			const percFree =
				(1 - Number(usage.usedSize) / Number(usage.currentSize)) * 100;

			// calculate % free to file with max size
			const percFreeMax =
				(1 - Number(usage.currentSize) / Number(usage.maxSize)) * 100;

			let message, subject: string;
			if (
				Number(file.growth) == 0 &&
				percFree < (monitor.sqlFileSizePercentFreeValue || 0)
			) {
				// alert for fixed file size
				message = `(Growth disabled) Percentage of free space (${Math.round(
					percFree,
				)}%) is less than the limit of ${
					monitor.sqlFileSizePercentFreeValue
				}%.`;
				subject = `💔 [${monitor.name}.${database.name} file ${file.fileName}] Alert: free space limit exceeded.`;
			} else if (
				Number(usage?.maxSize) > 0 &&
				percFreeMax < (monitor.sqlFileSizePercentFreeValue || 0)
			) {
				// alert for max file size
				message = `(Max file size) Percentage of free space (${Math.round(
					percFreeMax,
				)}%) is less than the limit of ${
					monitor.sqlFileSizePercentFreeValue
				}%.`;
				subject = `💔 [${monitor.name}.${database.name} file ${file.fileName}] Alert: free space limit exceeded.`;
			}

			if (message) {
				await Logger({
					message,
					type: 'error',
					monitor,
					database,
					file,
				});

				let resend = !file.sqlFileSizePercentFreeNotifySentAt;

				if (
					file.sqlFileSizePercentFreeNotifySentAt !== null &&
					monitor.sqlFileSizePercentFreeNotifyResendAfterMinutes &&
					monitor.sqlFileSizePercentFreeNotifyResendAfterMinutes > 0
				) {
					const diff =
						Date.now() - +new Date(file.sqlFileSizePercentFreeNotifySentAt);

					// allow nearly 2 mins off
					resend =
						Math.round(diff / 1000 / 60) + 0.8 >
						monitor.sqlFileSizePercentFreeNotifyResendAfterMinutes;
				}

				if (resend && monitor.sqlFileSizePercentFreeNotifyTypes) {
					const html = render(
						<ErrorEmail
							hostname={process.env.HOSTNAME}
							monitor={monitor}
							database={database}
							file={file}
							message={message}
						/>,
						{
							pretty: false,
						},
					);

					monitor.sqlFileSizePercentFreeNotifyTypes.map(
						async (notification: NotificationMeta) => {
							try {
								// await to prevent error from bubbling
								return await sendNotification({
									notification,
									subject,
									message: html,
								});
							} catch (e) {
								return Logger({
									message: `Failed to send ${notification.name}: ${e}`,
									type: 'error',
									monitor,
									file,
									database,
								});
							}
						},
					);

					return setFilePercFreeSentAt({
						id: file.id,
						sqlFileSizePercentFreeNotifySentAt: new Date(),
					});
				}
			} else {
				await allClear({ monitor, database, file });
				return resetFile({ file });
			}
		}),
	);
}
