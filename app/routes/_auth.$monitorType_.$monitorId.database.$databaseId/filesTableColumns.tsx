import type { ColumnDef } from '@tanstack/react-table';
import bytes from 'bytes';
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
		sortingFn: 'alphanumeric',
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
		sortingFn: 'alphanumeric',
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
		sortingFn: 'alphanumeric',
	},
	{
		accessorKey: 'currentSize',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Size" />
		),
		cell: ({ row }) => {
			console.log(row.original);
			return (
				<div
					className={`${
						row.original.state !== 'ONLINE' ? 'text-orange-700' : ''
					}`}
				>
					{row.original.usage?.[0].currentSize
						? bytes(Number(row.original.usage?.[0].currentSize))
						: 'n/a'}
				</div>
			);
		},
		sortingFn: 'alphanumeric',
	},
];
