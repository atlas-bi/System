import type { ActionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { NodeSSH } from 'node-ssh';
import { namedAction } from 'remix-utils';
import { createMonitor } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';

import SMTP from '~/notifications/smtp';
import Telegram from '~/notifications/telegram';
import { createNotification } from '~/models/notification.server';

const isNullOrEmpty = (str: string | undefined | FormDataEntryValue) => {
	if (str === undefined || str === null || str.toString().trim() === '') {
		return true;
	}
	return false;
};

const validateForm = ({ values }) => {
	if (isNullOrEmpty(values.name)) {
		return json({ form: { error: 'Name is required.' } });
	}

	if (isNullOrEmpty(values.type)) {
		return json({ form: { error: 'Type is required.' } });
	}

	if (values.type.toString() === 'smtp') {
		if (isNullOrEmpty(values.smtpHost)) {
			return json({ form: { error: 'Host is required.' } });
		}

		if (isNullOrEmpty(values.smtpPort)) {
			return json({ form: { error: 'Port is required.' } });
		}

		if (isNullOrEmpty(values.smtpSecurity)) {
			return json({ form: { error: 'Security is required.' } });
		}

		if (isNullOrEmpty(values.smtpFromEmail)) {
			return json({ form: { error: 'From email is required.' } });
		}

		if (isNullOrEmpty(values.smtpToEmail) && isNullOrEmpty(values.privateKey)) {
			return json({
				form: { error: 'To email is required.' },
			});
		}
	}

	if (values.type.toString() === 'telegram') {
		if (isNullOrEmpty(values.tgBotToken)) {
			return json({ form: { error: 'Bot token is required.' } });
		}

		if (isNullOrEmpty(values.tgChatId)) {
			return json({ form: { error: 'Chat ID is required.' } });
		}
	}
};

export async function action({ request }: ActionArgs) {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	return namedAction(request, {
		async new() {
			const formData = await request.formData();
			const { _action, ...values } = Object.fromEntries(formData);

			const errors = validateForm({ values });

			if (errors) return errors;

			const {
				name,
				type,
				smtpPort,
				smtpUsername,
				smtpHost,
				smtpPassword,
				smtpSecurity,
				ignoreSSLErrors,
				smtpFromName,
				smtpFromEmail,
				smtpToEmail,
				tgBotToken,
				tgChatId,
				tgThreadId,
				tgSendSilently,
				tgProtectMessage,
			} = values;

			console.log(values);
			await createNotification({
				name: name.toString(),
				type: type.toString(),
				smtpPort: smtpPort ? smtpPort.toString() : undefined,
				smtpUsername: smtpUsername ? smtpUsername.toString() : undefined,
				smtpHost: smtpHost ? smtpHost.toString() : undefined,
				smtpPassword: smtpPassword ? smtpPassword.toString() : undefined,
				smtpSecurity: smtpSecurity ? smtpSecurity.toString() : undefined,
				ignoreSSLErrors: ignoreSSLErrors
					? ignoreSSLErrors.toString() == 'true'
					: undefined,
				smtpFromName: smtpFromName ? smtpFromName.toString() : undefined,
				smtpFromEmail: smtpFromEmail ? smtpFromEmail.toString() : undefined,
				smtpToEmail: smtpToEmail ? smtpToEmail.toString() : undefined,
				tgBotToken: tgBotToken ? tgBotToken.toString() : undefined,
				tgChatId: tgChatId ? tgChatId.toString() : undefined,
				tgThreadId: tgThreadId ? tgThreadId.toString() : undefined,
				tgSendSilently: tgSendSilently
					? tgSendSilently.toString() == 'true'
					: undefined,
				tgProtectMessage: tgProtectMessage
					? tgProtectMessage.toString() == 'true'
					: undefined,
			});

			return json({ success: 'Notification Created' });
		},

		async test() {
			const formData = await request.formData();
			const { _action, ...values } = Object.fromEntries(formData);

			const errors = validateForm({ values });

			if (errors) return errors;

			if (values.type === 'smtp') {
				try {
					await SMTP({
						subject: 'connection test',
						message: 'connection test',
						notification: { ...values },
						test: true,
					});
				} catch (e) {
					return json({ error: e });
				}
				return json({ success: 'Connection successful, test message sent.' });
			} else if (values.type === 'telegram') {
				try {
					await Telegram({
						message: 'connection test',
						notification: { ...values },
						test: true,
					});
				} catch (e) {
					return json({ error: e });
				}
				return json({ success: 'Connection successful, test message sent.' });
			}

			return json({ error: 'Failed to test.' });
		},
	});
}
