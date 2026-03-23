import {
	SiUbuntu,
} from '@icons-pack/react-simple-icons';
import { Database, Laptop, Monitor, SmartphoneNfc } from 'lucide-react';

export const monitorTypes = [
	{
		name: 'Windows',
		value: 'windows',
		icon: <Monitor className="h-auto w-auto" />,
	},
	{
		name: 'Ubuntu',
		value: 'ubuntu',
		icon: <SiUbuntu className="h-auto w-auto" />,
	},
	{ name: 'Http', value: 'http', icon: <Laptop className="h-auto w-auto" /> },
	{
		name: 'Sql Server',
		value: 'sqlServer',
		icon: <Database className="h-auto w-auto" />,
	},
	{
		name: 'TCP Ping',
		value: 'tcp',
		icon: <SmartphoneNfc className="h-auto w-auto" />,
	},
];
