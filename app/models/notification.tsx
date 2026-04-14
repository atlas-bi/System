import { Mail } from 'lucide-react';
import { SiTelegram } from '@icons-pack/react-simple-icons';
export const notificationTypes = [
	{
		name: 'SMTP Email',
		value: 'smtp',
		icon: <Mail className="h-auto w-auto" />,
	},
	{
		name: 'Telegram',
		value: 'telegram',
		icon: <SiTelegram className="h-auto w-auto" />,
	},
];
