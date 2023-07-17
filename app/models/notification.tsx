import { Mail, Send } from 'lucide-react';

export const notificationTypes = [
	{ name: 'SMTP Email', value: 'smtp', icon: <Mail /> },
	{ name: 'Telegram', value: 'telegram', icon: <Send /> },
];
