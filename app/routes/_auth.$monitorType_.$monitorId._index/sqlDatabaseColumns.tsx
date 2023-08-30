import type { ColumnDef } from '@tanstack/react-table';
import { Activity, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { DataTableColumnHeader } from '~/components/table/data-table-column-header';
import { Minus } from 'lucide-react';
import { formatInTimeZone, formatInTimeZone } from 'date-fns-tz';
import { formatDistance } from 'date-fns';
import { Badge } from '~/components/ui/badge';
import { useFetcher } from '@remix-run/react';
import { useEffect } from 'react';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '~/components/ui/tooltip';
import { DatabaseUsage } from '@prisma/client';
import { PingStat } from './responseTime';

export const columns: ColumnDef<any>[] = [
	{
		accessorKey: 'name',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Name" />
		),
		cell: ({ row }) => (
			<div className="flex content-center space-x-2">
				<span className="my-auto">{row.getValue('name')}</span>
			</div>
		),
		enableSorting: true,
		enableHiding: false,
		sortingFn: 'alphanumeric',
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
				{!row.getValue('enabled') ? (
					<Minus className="text-slate-400" size={14} />
				) : row.getValue('hasError') ? (
					<AlertTriangle className="text-red-500" size={14} />
				) : (
					<Activity className="text-emerald-600" size={14} />
				)}
			</div>
		),
	},
	{
		accessorKey: 'title',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Title" />
		),
		cell: ({ row }) => row.getValue('title'),
		sortingFn: 'alphanumeric',
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
		accessorKey: 'recoveryModel',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Recovery Model" />
		),
		cell: ({ row }) => row.getValue('recoveryModel'),
		sortingFn: 'alphanumeric',
	},
	{
		accessorKey: 'compatLevel',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Compatibility" />
		),
		cell: ({ row }) => row.getValue('compatLevel'),
		sortingFn: 'alphanumeric',
	},
	{
		accessorKey: 'backupDataDate',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Last Data Backup" />
		),
		cell: ({ row }) => (
			<div className="flex content-center space-x-2">
				{row.original.backupDataDate ? (
					<>
						<span className="my-auto">
							{formatDistance(
								new Date(row.original.backupDataDate),
								new Date(),
							)}{' '}
							ago.
						</span>
						<Badge className="whitespace-nowrap my-auto bg-slate-200 hover:bg-slate-300 hover:cursor-default text-slate-900">
							{formatInTimeZone(
								row.original.backupDataDate,
								Intl.DateTimeFormat().resolvedOptions().timeZone,
								'MMM d, yyyy k:mm',
							)}
						</Badge>
					</>
				) : (
					'n/a'
				)}
			</div>
		),
		sortingFn: 'alphanumeric',
	},
	{
		accessorKey: 'backupLogDate',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Last Logs Backup" />
		),
		cell: ({ row }) => (
			<div className="flex content-center space-x-2">
				{row.original.backupLogDate ? (
					<>
						<span className="my-auto">
							{formatDistance(new Date(row.original.backupLogDate), new Date())}{' '}
							ago.
						</span>
						<Badge className="whitespace-nowrap my-auto bg-slate-200 hover:bg-slate-300 hover:cursor-default text-slate-900">
							{formatInTimeZone(
								row.original.backupLogDate,
								Intl.DateTimeFormat().resolvedOptions().timeZone,
								'MMM d, yyyy k:mm',
							)}
						</Badge>
					</>
				) : (
					'n/a'
				)}
			</div>
		),
		sortingFn: 'alphanumeric',
	},
	{
		accessorKey: 'feeds',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Ping" />
		),
		cell: ({ row }) => (
			<PingStat
				url={`/${row.original.monitor.type}/${row.original.monitor.id}/database/${row.original.id}/ping-latest`}
			/>
		),
		enableSorting: false,
	},
];
