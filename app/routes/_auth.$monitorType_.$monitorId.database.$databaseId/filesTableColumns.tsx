import type { ColumnDef } from '@tanstack/react-table';
import { ToggleLeft, ToggleRight } from 'lucide-react';

import { DataTableColumnHeader } from '~/components/table/data-table-column-header';

export const columns: ColumnDef<any>[] = [
	{
		accessorKey: 'fileName',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Name" />
		),
		cell: ({ row }) => (
			<div className="flex content-center space-x-2">
				<span className="my-auto">{row.getValue('fileName')}</span>
			</div>
		),
		enableSorting: true,
		enableHiding: false,
	},

	{
		accessorKey: 'type',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Type" />
		),
		cell: ({ row }) => (
			<div className="">
				{row.getValue('type') ? (
					<ToggleRight className="text-emerald-700" />
				) : (
					<ToggleLeft className="text-slate-400" />
				)}
			</div>
		),
	},
	{
		accessorKey: 'filePath',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Path" />
		),
		cell: ({ row }) => row.getValue('filePath'),
	},
	{
		accessorKey: 'state',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => (
			<div
				className={`${
					row.original.state !== 'ONLINE' ? 'text-orange-700' : ''
				}`}
			>
				{row.getValue('state')}
			</div>
		),
	},
];
