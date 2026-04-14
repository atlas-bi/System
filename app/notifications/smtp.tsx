import { decrypt } from "@/lib/utils";
import nodemailer from "nodemailer";

import type { Notification } from "~/models/notification.server";

export default async function SMTP({
	notification,
	subject,
	message,
	test,
}: {
	notification: Notification;
	subject: string;
	message: string;
	test?: Boolean;
}) {
	if (!notification.smtpHost || !notification.smtpPort) {
		throw new Error("SMTP host and port are required");
	}
	if (!notification.smtpToEmail || !notification.smtpFromEmail) {
		throw new Error("SMTP to/from email are required");
	}

	const config = {
		host: notification.smtpHost,
		port: Number(notification.smtpPort),
		secure: Boolean(notification.smtpSecurity) || false,
		tls: {
			rejectUnauthorized: Boolean(notification.ignoreSSLErrors) || false,
		},
		auth: notification.smtpUsername
			? {
					user: notification.smtpUsername,
					pass: test
						? notification.smtpPassword
						: notification.smtpPassword
							? decrypt(notification.smtpPassword)
							: null,
				}
			: undefined,
	};

	let transporter = nodemailer.createTransport(config);

	await transporter.sendMail({
		from: notification.smtpFromName
			? `"${notification.smtpFromName}" ${notification.smtpFromEmail}`
			: notification.smtpFromEmail,
		to: notification.smtpToEmail,
		subject: subject,
		html: message,
	});

	return "Sent Successfully.";
}
