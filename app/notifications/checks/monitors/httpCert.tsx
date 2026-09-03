import { setMonitorHttpCertSentAt } from "~/models/monitor.server";
import type { MonitorWithRelations } from "~/models/monitor.server";
import type { NotificationMeta } from "~/models/notification.server";
import { Logger } from "~/notifications/logger";
import { sendNotification } from "~/notifications/notifier";
import { render } from "@react-email/render";
import {
	InvalidEmail,
	SuccessEmail,
	ErrorEmail,
} from "~/notifications/email/monitors/httpCert";

export default async function httpCertNotifier({
	monitor,
}: {
	monitor: MonitorWithRelations;
}) {
	// don't notify if disabled. httpCheckCert is the monitor-level switch;
	// the notifications UI is hidden when it is off, but httpCertNotify can
	// remain true in the database from a previous configuration.
	if (
		!monitor.httpCheckCert ||
		!monitor.httpCertNotify ||
		monitor.type !== "http" ||
		!monitor.httpUrl ||
		!monitor.httpUrl.startsWith("https")
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
	if (monitor.certValid === false || monitor.certDays == null) {
		const snippet =
			monitor.certDays == null
				? "Certificate could not be determined"
				: "Certificate is invalid";
		subject = `🔓 [${monitor.name || monitor.title} (${
			monitor.httpUrl
		})] ${snippet}.`;
		html = await render(
			<InvalidEmail
				hostname={process.env.HOSTNAME}
				monitor={monitor}
				message={snippet}
			/>,
			{
				pretty: false,
			},
		);
		message = `${snippet}.`;
	} else if (Number(monitor.certDays) <= 21) {
		subject = `🔓 [${monitor.name || monitor.title} (${
			monitor.httpUrl
		})] Certificate expires in ${monitor.certDays} days.`;
		html = await render(
			<ErrorEmail hostname={process.env.HOSTNAME} monitor={monitor} />,
			{
				pretty: false,
			},
		);
		message = `Certificate expires in ${monitor.certDays} days.`;
	}

	if ((!subject || !html || !message) && monitor.httpCertNotifySentAt) {
		// all clear
		subject = `🔒 [${monitor.name || monitor.title} (${
			monitor.httpUrl
		})] Certificate is valid.`;
		html = await render(
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

		monitor.httpCertNotifyTypes.map(async (notification: NotificationMeta) => {
			try {
				if (!subject || !html) {
					/* v8 ignore next -- defensive guard; subject/html are set above */
					return;
				}
				return await sendNotification({
					notification,
					subject,
					message: html,
				});
			} catch (e) {
				return Logger({
					message: `Failed to send ${notification.name}: ${e}`,
					type: "error",
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
		const subjectToSend = subject;
		const htmlToSend = html;
		monitor.httpCertNotifyTypes.map(async (notification: NotificationMeta) => {
			try {
				return await sendNotification({
					notification,
					subject: subjectToSend,
					message: htmlToSend,
				});
			} catch (e) {
				return Logger({
					message: `Failed to send ${notification.name}: ${e}`,
					type: "error",
					monitor,
				});
			}
		});
		await Logger({
			message: message || "",
			type: "error",
			monitor,
		});
		return setMonitorHttpCertSentAt({
			id: monitor.id,
			httpCertNotifySentAt: new Date(),
		});
	}
}
