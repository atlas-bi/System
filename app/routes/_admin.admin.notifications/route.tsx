import { json } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import {
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import React from 'react';
import { DataTableToolbar } from '~/components/table/data-table-toolbar';
import { getNotificationsDetail } from '~/models/notification.server';
import { authenticator } from '~/services/auth.server';
import { columns } from './table_columns';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table';
import { DataTablePagination } from '~/components/table/data-table-pagination';
import { Button } from '~/components/ui/button';
import { Settings } from 'lucide-react';
import Notification from '~/components/notificationForms/base';
import { decrypt } from '@/lib/utils';

export const loader = async ({ request, params }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	const notifications = await getNotificationsDetail();
	return json({
		notifications: notifications.map((x) => ({
			...x,
			title: x.name,
			password: x.password ? decrypt(x.password) : undefined,
			tgBotToken: x.tgBotToken ? decrypt(x.tgBotToken) : undefined,
		})),
	});
};

export default function Index() {
	const { notifications } = useLoaderData<typeof loader>();
	const [rowSelection, setRowSelection] = React.useState({});

	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});

	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [sorting, setSorting] = React.useState<SortingState>([
		{ id: 'title', asc: true },
	]);

	const table = useReactTable({
		data: notifications,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});
	const navigate = useNavigate();
	return (
		<>
			<div className="space-y-4">
				<DataTableToolbar table={table} />

				<div className="rounded-md border">
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return (
											<TableHead key={header.id}>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
													  )}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<Notification notification={row.original} key={row.id}>
										<TableRow
											key={row.id}
											className="cursor-pointer"
											data-state={row.getIsSelected() ? 'selected' : null}
											// onClick={() =>
											// 	//navigate(`/${row.original.type}/${row.original.id}`)
											// }
										>
											{row.getVisibleCells().map((cell) => (
												<TableCell key={cell.id}>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</TableCell>
											))}
										</TableRow>
									</Notification>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center"
									>
										No results.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<DataTablePagination table={table} />
			</div>
		</>
	);
}
