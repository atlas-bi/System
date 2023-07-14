import { encrypt } from '@/lib/utils';
import { prisma } from '~/db.server';

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
      smtpPassword: smtpPassword ? encrypt(smtpPassword) : undefined,
      smtpSecurity,
      ignoreSSLErrors,
      smtpFromName,
      smtpFromEmail,
      smtpToEmail,
      tgBotToken: tgBotToken ? encrypt(tgBotToken) : undefined,
      tgChatId,
      tgThreadId,
      tgSendSilently,
      tgProtectMessage,
    },
  });
}
