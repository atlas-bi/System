import type SMTPConnection from 'nodemailer/lib/smtp-connection';

export const SmtpConfig: SMTPConnection.Options = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 25),
  secure: process.env.SMTP_TLS === 'true',
};

if (
  typeof process.env.SMTP_USERNAME === 'string' &&
  process.env.SMTP_USERNAME.length > 0
) {
  SmtpConfig.auth = {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  };
}
