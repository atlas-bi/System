import {
	SiUbuntu,
	SiWindows95,
	SiMicrosoftsqlserver,
} from '@icons-pack/react-simple-icons';
import { Laptop } from 'lucide-react';

export const monitorTypes = [
	{
		name: 'Windows',
		value: 'windows',
		icon: <SiWindows95 className="h-auto w-auto" />,
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
		icon: <SiMicrosoftsqlserver className="h-auto w-auto" />,
	},
];
