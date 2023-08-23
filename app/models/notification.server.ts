import { encrypt } from '@/lib/utils';
import { prisma } from '~/db.server';

import type { Notification } from '@prisma/client';
export type { Notification } from '@prisma/client';

export function getNotifications() {
	return prisma.notification.findMany({
		select: {
			id: true,
			name: true,
			type: true,
		},
	});
}

export function getNotificationsDetail() {
	return prisma.notification.findMany({
		select: {
			id: true,
			name: true,
			type: true,
			smtpPort: true,
			smtpUsername: true,
			smtpHost: true,
			smtpPassword: true,
			smtpSecurity: true,
			ignoreSSLErrors: true,
			smtpFromName: true,
			smtpFromEmail: true,
			smtpToEmail: true,
			tgBotToken: true,
			tgChatId: true,
			tgThreadId: true,
			tgSendSilently: true,
			tgProtectMessage: true,
		},
	});
}

export function deleteNotification({ id }: Pick<Notification, 'id'>) {
	return prisma.notification.deleteMany({
		where: { id },
	});
}

export function getNotificationConnection({ id }: Pick<Notification, 'id'>) {
	return prisma.notification.findUnique({
		where: { id },
	});
}

export function editNotification({
	id,
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
}: Pick<
	Notification,
	| 'id'
	| 'name'
	| 'type'
	| 'smtpPort'
	| 'smtpUsername'
	| 'smtpHost'
	| 'smtpPassword'
	| 'smtpSecurity'
	| 'ignoreSSLErrors'
	| 'smtpFromName'
	| 'smtpFromEmail'
	| 'smtpToEmail'
	| 'tgBotToken'
	| 'tgChatId'
	| 'tgThreadId'
	| 'tgSendSilently'
	| 'tgProtectMessage'
>) {
	return prisma.notification.update({
		where: { id },
		data: {
			name,
			type,
			smtpPort,
			smtpUsername,
			smtpHost,
			smtpPassword: smtpPassword ? encrypt(smtpPassword) : null,
			smtpSecurity,
			ignoreSSLErrors,
			smtpFromName,
			smtpFromEmail,
			smtpToEmail,
			tgBotToken: tgBotToken ? encrypt(tgBotToken) : null,
			tgChatId,
			tgThreadId,
			tgSendSilently,
			tgProtectMessage,
		},
	});
}
export function createNotification({
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
}: Pick<
	Notification,
	| 'name'
	| 'type'
	| 'smtpPort'
	| 'smtpUsername'
	| 'smtpHost'
	| 'smtpPassword'
	| 'smtpSecurity'
	| 'ignoreSSLErrors'
	| 'smtpFromName'
	| 'smtpFromEmail'
	| 'smtpToEmail'
	| 'tgBotToken'
	| 'tgChatId'
	| 'tgThreadId'
	| 'tgSendSilently'
	| 'tgProtectMessage'
>) {
	return prisma.notification.create({
		data: {
			name,
			type,
			smtpPort,
			smtpUsername,
			smtpHost,
			smtpPassword: smtpPassword ? encrypt(smtpPassword) : null,
			smtpSecurity,
			ignoreSSLErrors,
			smtpFromName,
			smtpFromEmail,
			smtpToEmail,
			tgBotToken: tgBotToken ? encrypt(tgBotToken) : null,
			tgChatId,
			tgThreadId,
			tgSendSilently,
			tgProtectMessage,
		},
	});
}
