import type { ColumnDef } from '@tanstack/react-table';
import { Activity, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { monitorTypes } from '~/models/monitor';
import { DataTableColumnHeader } from '~/components/table/data-table-column-header';

export const columns: ColumnDef<any>[] = [
	{
		accessorKey: 'title',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Title" />
		),
		cell: ({ row }) => {
			const icon = monitorTypes.filter(
				(type) => type.value == row.original.type,
			)?.[0]?.icon;
			return (
				<div className="flex content-center space-x-2">
					{icon && <>{icon}</>}
					<span className="my-auto">{row.getValue('title')}</span>
				</div>
			);
		},
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: 'enabled',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Enabled" />
		),
		cell: ({ row }) => (
			<div className="">
				{row.getValue('enabled') ? (
					<ToggleRight className="text-emerald-700" />
				) : (
					<ToggleLeft className="text-slate-400" />
				)}
			</div>
		),
	},
	{
		accessorKey: 'hasError',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => (
			<div className="">
				{row.getValue('hasError') ? (
					<AlertTriangle className="text-red-500" size={14} />
				) : (
					<Activity className="text-emerald-600" size={14} />
				)}
			</div>
		),
	},
	{
		accessorKey: 'host',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Host" />
		),
		cell: ({ row }) => <div className="">{row.getValue('host')}</div>,
	},
	{
		accessorKey: 'caption',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Caption" />
		),
		cell: ({ row }) => <div className="">{row.getValue('caption')}</div>,
	},
	{
		accessorKey: 'model',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Model" />
		),
		cell: ({ row }) => <div className="">{row.getValue('model')}</div>,
	},
	{
		accessorKey: 'name',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Name" />
		),
		cell: ({ row }) => <div className="">{row.getValue('name')}</div>,
	},
	{
		accessorKey: 'dnsHostName',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="DNS Hostname" />
		),
		cell: ({ row }) => <div className="">{row.getValue('dnsHostName')}</div>,
	},
	{
		accessorKey: 'domain',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Domain" />
		),
		cell: ({ row }) => <div className="">{row.getValue('domain')}</div>,
	},
	{
		accessorKey: 'manufacturer',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Manufacturer" />
		),
		cell: ({ row }) => <div className="">{row.getValue('manufacturer')}</div>,
	},
	{
		accessorKey: 'os',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Operating System" />
		),
		cell: ({ row }) => <div className="">{row.getValue('os')}</div>,
	},
	{
		accessorKey: 'osVersion',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="OS Version" />
		),
		cell: ({ row }) => <div className="">{row.getValue('osVersion')}</div>,
	},
];
