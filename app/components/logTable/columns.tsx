import type { ColumnDef } from '@tanstack/react-table';
import { Activity, AlertCircle, AlertTriangle } from 'lucide-react';
import { DataTableColumnHeader } from '~/components/table/data-table-column-header';
import { format } from 'date-fns';
import { Link } from '@remix-run/react';
import { jsonParser } from '@/lib/utils';

export const columns: ColumnDef<any>[] = [
	{
		accessorKey: 'type',
		header: () => <></>,
		cell: ({ row }) => (
			<div className="">
				{row.getValue('type') == 'error' ? (
					<AlertTriangle className="text-red-500" size={14} />
				) : row.getValue('type') == 'warning' ? (
					<AlertCircle className="text-orange-600" size={14} />
				) : (
					<Activity className="text-emerald-600" size={14} />
				)}
			</div>
		),
	},
	{
		accessorKey: 'createdAt',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Date" />
		),
		cell: ({ row }) => (
			<div className="">
				{format(new Date(row.getValue('createdAt')), 'MMM dd, yyyy k:mm')}
			</div>
		),
	},
	{
		accessorKey: 'message',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Message" />
		),
		cell: ({ row }) => {
			const message = jsonParser(row.getValue('message'));

			return (
				<div className="space-x-2">
					{row.original.drive && (
						<>
							<Link
								to={`/${row.original?.monitor?.type}/${row.original?.monitor?.id}/drive/${row.original?.drive?.id}`}
								prefetch="intent"
								className="text-sky-700"
							>
								{row.original?.drive?.root}
								{row.original?.drive?.location}
							</Link>
						</>
					)}
					<span>
						{message?.errno ? (
							<>
								{message?.errno} {message?.code}
							</>
						) : message?.stderr ? (
							<>{message.stderr}</>
						) : (
							JSON.stringify(message)
						)}
					</span>
				</div>
			);
		},
	},
];
