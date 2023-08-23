import type { ColumnDef } from '@tanstack/react-table';
import { Activity, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { monitorTypes } from '~/models/monitor';
import { DataTableColumnHeader } from '~/components/table/data-table-column-header';
import { Minus } from 'lucide-react';
import { MonitorFeeds } from '@prisma/client';
import { formatInTimeZone } from 'date-fns-tz';

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '~/components/ui/tooltip';
import { format } from 'date-fns';
import { useFetcher } from '@remix-run/react';
import { useEffect } from 'react';

export const columnsSsh: ColumnDef<any>[] = [
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
					{icon && (
						<div className="h-4 w-4 flex text-muted-foreground my-auto">
							{icon}
						</div>
					)}
					<span className="my-auto">{row.getValue('title')}</span>
				</div>
			);
		},
		enableSorting: true,
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

export const columnsPing: ColumnDef<any>[] = [
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
					{icon && (
						<div className="h-4 w-4 flex text-muted-foreground my-auto">
							{icon}
						</div>
					)}
					<span className="my-auto">{row.getValue('title')}</span>
				</div>
			);
		},
		enableSorting: true,
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
		accessorKey: 'feeds',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Ping" />
		),
		cell: ({ row }) => {
			const pingFetcher = useFetcher();
			const url = `/${row.original.type}/${row.original.id}/ping-latest`;

			useEffect(() => {
				const interval = setInterval(() => {
					if (document.visibilityState === 'visible') {
						pingFetcher.load(url);
					}
				}, 30 * 1000);
				return () => clearInterval(interval);
			}, []);

			useEffect(() => {
				if (pingFetcher.state === 'idle' && pingFetcher.data == null) {
					pingFetcher.load(url);
				}
			}, [pingFetcher]);

			return (
				<div
					className={`transition-colors flex flex-row-reverse space-x-1 space-x-reverse ${
						row.original.enabled ? '' : 'opacity-50 group-hover:opacity-100'
					}`}
				>
					{pingFetcher.data?.feeds?.map((x: MonitorFeeds) => (
						<TooltipProvider
							key={x.id}
							delayDuration={20}
							skipDelayDuration={20}
						>
							<Tooltip>
								<TooltipTrigger asChild>
									<div
										className={`transition-all w-2 h-4 hover:scale-125 rounded ${
											x.hasError ? 'bg-red-300' : 'bg-emerald-600'
										}`}
									></div>
								</TooltipTrigger>
								<TooltipContent>
									<div>
										<div className="flex space-x-2">
											<div
												className={`${
													x.hasError
														? 'bg-red-300 border-red-400'
														: 'bg-emerald-600 border-emerald-700'
												} border-1 rounded h-3 w-3 my-auto`}
											></div>

											<strong>{x.ping}ms</strong>
											<span>
												{formatInTimeZone(
													x.createdAt,
													Intl.DateTimeFormat().resolvedOptions().timeZone,
													'MMM d, yyyy k:mm',
												)}
											</span>
										</div>
										{x.message && <>{x.message}</>}
									</div>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					))}
				</div>
			);
		},
		enableSorting: false,
	},
];
