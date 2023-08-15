import type { ColumnDef } from '@tanstack/react-table';
import { Activity, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { monitorTypes } from '~/models/monitor';
import { DataTableColumnHeader } from '~/components/table/data-table-column-header';
import { Minus } from 'lucide-react';
import { SiTelegram } from '@icons-pack/react-simple-icons';
import { notificationTypes } from '~/models/notification';

export const columns: ColumnDef<any>[] = [
	{
		accessorKey: 'type',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Type" />
		),
		cell: ({ row }) => {
			const icon = notificationTypes.filter(
				(type) => type.value == row.original.type,
			)?.[0]?.icon;
			return (
				<div className="flex content-center space-x-2">
					{icon && (
						<div className="h-4 w-4 flex text-muted-foreground">{icon}</div>
					)}
					<span className="my-auto">{row.getValue('type')}</span>
				</div>
			);
		},
	},
	{
		accessorKey: 'title',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Name" />
		),
		cell: ({ row }) => {
			return <div className="">{row.getValue('title')}</div>;
		},
		enableSorting: true,
		enableHiding: false,
	},
];
