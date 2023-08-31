import { Monitor, setMonitorHttpCertSentAt } from '~/models/monitor.server';
import type { Notification } from '~/models/notification.server';
import { Logger } from '~/notifications/logger';
import { sendNotification } from '~/notifications/notifier';
import { render } from '@react-email/render';
import {
	InvalidEmail,
	SuccessEmail,
	ErrorEmail,
} from '~/notifications/email/monitors/httpCert';

export default async function httpCertNotifier({
	monitor,
}: {
	monitor: Monitor & { httpCertNotifyTypes: Notification[] };
}) {
	// don't notify if disabled.
	if (
		!monitor.httpCertNotify ||
		monitor.type !== 'http' ||
		!monitor.httpUrl.startsWith('https')
	) {
		return setMonitorHttpCertSentAt({
			id: monitor.id,
			httpCertNotifySentAt: null,
		});
	}

	let subject: string | undefined = undefined,
		html: string | undefined = undefined,
		message: string | undefined = undefined;

	// check for invalid cert or cert near expiry
	if (monitor.certValid === false) {
		subject = `🔓 [${monitor.name || monitor.title} (${
			monitor.httpUrl
		})] Certificate is invalid.`;
		html = render(
			<InvalidEmail hostname={process.env.HOSTNAME} monitor={monitor} />,
			{
				pretty: false,
			},
		);
		message = 'Certificate is invalid';
	} else if (monitor.certDays <= 21) {
		subject = `🔓 [${monitor.name || monitor.title} (${
			monitor.httpUrl
		})] Certificate expires in ${monitor.certDays}.`;
		html = render(
			<ErrorEmail hostname={process.env.HOSTNAME} monitor={monitor} />,
			{
				pretty: false,
			},
		);
		message = `Certificate expires in ${monitor.certDays}.`;
	}

	if ((!subject || !html || !message) && monitor.httpCertNotifySentAt) {
		// all clear
		subject = `🔒 [${monitor.name || monitor.title} (${
			monitor.httpUrl
		})] Certificate is valid.`;
		html = render(
			<SuccessEmail
				subject={subject}
				hostname={process.env.HOSTNAME}
				monitor={monitor}
			/>,
			{
				pretty: false,
			},
		);
		message = subject;

		monitor.httpCertNotifyTypes.map(async (notification: Notification) => {
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
				});
			}
		});
		return setMonitorHttpCertSentAt({
			id: monitor.id,
			httpCertNotifySentAt: null,
		});
	}

	let resend = !monitor.httpCertNotifySentAt;

	if (
		monitor.httpCertNotifySentAt !== null &&
		monitor.httpCertNotifyResendAfterMinutes &&
		monitor.httpCertNotifyResendAfterMinutes > 0
	) {
		const diff = Date.now() - +new Date(monitor.httpCertNotifySentAt);

		// allow nearly 2 mins off
		resend =
			Math.round(diff / 1000 / 60) + 0.8 >
			monitor.httpCertNotifyResendAfterMinutes;
	}

	if (resend && subject && html) {
		monitor.httpCertNotifyTypes.map(async (notification: Notification) => {
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
				});
			}
		});
		await Logger({
			message: message || '',
			type: 'error',
			monitor,
		});
		return setMonitorHttpCertSentAt({
			id: monitor.id,
			httpCertNotifySentAt: new Date(),
		});
	}
}
