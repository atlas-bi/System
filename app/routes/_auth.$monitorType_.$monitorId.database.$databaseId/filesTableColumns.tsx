import { useFetcher, useParams } from '@remix-run/react';
import type { ColumnDef } from '@tanstack/react-table';
import bytes from 'bytes';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { useEffect } from 'react';

import { DataTableColumnHeader } from '~/components/table/data-table-column-header';
import { Skeleton } from '~/components/ui/skeleton';

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
			const sizeFetcher = useFetcher();
			const { monitorType, monitorId, databaseId } = useParams();
			useEffect(() => {
				if (sizeFetcher.state === 'idle' && sizeFetcher.data == null) {
					sizeFetcher.load(
						`/${monitorType}/${monitorId}/database/${databaseId}/file/${row.original.id}/usage-latest`,
					);
				}
			}, []);
			return (
				<div
					className={`${
						row.original.state !== 'ONLINE' ? 'text-orange-700' : ''
					}`}
				>
					{sizeFetcher.data ? (
						bytes(Number(sizeFetcher?.data?.usage?.currentSize)) || '-1'
					) : (
						<Skeleton className="h-3 w-full max-w-[60px] rounded-sm" />
					)}
				</div>
			);
		},
		sortingFn: 'alphanumeric',
	},
];
