import { decrypt } from '@/lib/utils';
import nodemailer from 'nodemailer';

import type { Notification } from '~/models/notification.server';

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
  const config = {
    host: notification.smtpHost,
    port: notification.smtpPort,
    secure: notification.smtpSecure || false,
    tls: {
      rejectUnauthorized: notification.smtpIgnoreTLSError || false,
    },
    auth: notification.smtpUsername
      ? {
          user: notification.smtpUsername,
          pass: test
            ? notification.smtpPassword
            : decrypt(notification.smtpPassword),
        }
      : undefined,
  };

  let transporter = nodemailer.createTransport(config);

  console.log(notification);
  await transporter.sendMail({
    from: notification.smtpFromName
      ? `"${notification.smtpFromName}" ${notification.smtpFromEmail}`
      : notification.smtpFromEmail,
    to: notification.smtpToEmail,
    subject: subject,
    text: message,
  });

  return 'Sent Successfully.';
}
