import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { namedAction, redirectBack } from "~/utils";

import { authenticator } from "~/services/auth.server";

import SMTP from "~/notifications/smtp";
import Telegram from "~/notifications/telegram";
import {
	createNotification,
	editNotification,
	deleteNotification,
} from "~/models/notification.server";

const isNullOrEmpty = (str: string | undefined | FormDataEntryValue) => {
	if (str === undefined || str === null || str.toString().trim() === "") {
		return true;
	}
	return false;
};

const validateForm = ({ values }: { values: any }) => {
	if (isNullOrEmpty(values.name)) {
		return json({ form: { error: "Name is required." } });
	}

	if (isNullOrEmpty(values.type)) {
		return json({ form: { error: "Type is required." } });
	}

	if (values.type.toString() === "smtp") {
		if (isNullOrEmpty(values.smtpHost)) {
			return json({ form: { error: "Host is required." } });
		}

		if (isNullOrEmpty(values.smtpPort)) {
			return json({ form: { error: "Port is required." } });
		}

		if (isNullOrEmpty(values.smtpSecurity)) {
			return json({ form: { error: "Security is required." } });
		}

		if (isNullOrEmpty(values.smtpFromEmail)) {
			return json({ form: { error: "From email is required." } });
		}

		if (isNullOrEmpty(values.smtpToEmail) && isNullOrEmpty(values.privateKey)) {
			return json({
				form: { error: "To email is required." },
			});
		}
	}

	if (values.type.toString() === "telegram") {
		if (isNullOrEmpty(values.tgBotToken)) {
			return json({ form: { error: "Bot token is required." } });
		}

		if (isNullOrEmpty(values.tgChatId)) {
			return json({ form: { error: "Chat ID is required." } });
		}
	}
};

export async function action({ request }: ActionFunctionArgs) {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	return namedAction(request, {
		async new(formData) {
			const { _action, ...values } = Object.fromEntries(formData);

			const errors = validateForm({ values });

			if (errors) return errors;

			let notification = {};

			if (values.id) {
				notification = await editNotification({
					id: values.id.toString(),
					name: values.name.toString(),
					type: values.type.toString(),
					smtpPort: values.smtpPort ? values.smtpPort.toString() : null,
					smtpUsername: values.smtpUsername
						? values.smtpUsername.toString()
						: null,
					smtpHost: values.smtpHost ? values.smtpHost.toString() : null,
					smtpPassword: values.smtpPassword
						? values.smtpPassword.toString()
						: null,
					smtpSecurity: values.smtpSecurity
						? values.smtpSecurity.toString()
						: null,
					ignoreSSLErrors: values.ignoreSSLErrors
						? values.ignoreSSLErrors.toString() == "true"
						: null,
					smtpFromName: values.smtpFromName
						? values.smtpFromName.toString()
						: null,
					smtpFromEmail: values.smtpFromEmail
						? values.smtpFromEmail.toString()
						: null,
					smtpToEmail: values.smtpToEmail
						? values.smtpToEmail.toString()
						: null,
					tgBotToken: values.tgBotToken ? values.tgBotToken.toString() : null,
					tgChatId: values.tgChatId ? values.tgChatId.toString() : null,
					tgThreadId: values.tgThreadId ? values.tgThreadId.toString() : null,
					tgSendSilently: values.tgSendSilently
						? values.tgSendSilently.toString() == "true"
						: null,
					tgProtectMessage: values.tgProtectMessage
						? values.tgProtectMessage.toString() == "true"
						: null,
				});

				return json({ notification });
			}
			notification = await createNotification({
				name: values.name.toString(),
				type: values.type.toString(),
				smtpPort: values.smtpPort ? values.smtpPort.toString() : null,
				smtpUsername: values.smtpUsername
					? values.smtpUsername.toString()
					: null,
				smtpHost: values.smtpHost ? values.smtpHost.toString() : null,
				smtpPassword: values.smtpPassword
					? values.smtpPassword.toString()
					: null,
				smtpSecurity: values.smtpSecurity
					? values.smtpSecurity.toString()
					: null,
				ignoreSSLErrors: values.ignoreSSLErrors
					? values.ignoreSSLErrors.toString() == "true"
					: null,
				smtpFromName: values.smtpFromName
					? values.smtpFromName.toString()
					: null,
				smtpFromEmail: values.smtpFromEmail
					? values.smtpFromEmail.toString()
					: null,
				smtpToEmail: values.smtpToEmail ? values.smtpToEmail.toString() : null,
				tgBotToken: values.tgBotToken ? values.tgBotToken.toString() : null,
				tgChatId: values.tgChatId ? values.tgChatId.toString() : null,
				tgThreadId: values.tgThreadId ? values.tgThreadId.toString() : null,
				tgSendSilently: values.tgSendSilently
					? values.tgSendSilently.toString() == "true"
					: null,
				tgProtectMessage: values.tgProtectMessage
					? values.tgProtectMessage.toString() == "true"
					: null,
			});

			return json({ notification });
		},
		async delete(formData) {
			const { _action, ...values } = Object.fromEntries(formData);

			await deleteNotification({ id: values.id.toString() });
			return redirectBack(request, { fallback: "/admin/notifications" });
		},
		async test(formData) {
			const { _action, ...values } = Object.fromEntries(formData);

			const errors = validateForm({ values });

			if (errors) return errors;

			if (values.type === "smtp") {
				try {
					await SMTP({
						subject: "connection test",
						message: "connection test",
						notification: values as any,
						test: true,
					});
				} catch (e) {
					return json({ error: e });
				}
				return json({ success: "Connection successful, test message sent." });
			} else if (values.type === "telegram") {
				try {
					await Telegram({
						message: "connection test",
						notification: values as any,
						test: true,
					});
				} catch (e) {
					return json({ error: e });
				}
				return json({ success: "Connection successful, test message sent." });
			}

			return json({ error: "Failed to test." });
		},
	});
}
