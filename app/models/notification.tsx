import { Mail, Send } from 'lucide-react';
import { SiTelegram } from '@icons-pack/react-simple-icons';
export const notificationTypes = [
	{ name: 'SMTP Email', value: 'smtp', icon: <Mail /> },
	{ name: 'Telegram', value: 'telegram', icon: <SiTelegram /> },
];
