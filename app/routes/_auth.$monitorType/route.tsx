import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Outlet, useLoaderData, useNavigate } from '@remix-run/react';
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	VisibilityState,
} from '@tanstack/react-table';
import {
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
import { DataTablePagination } from '~/components/table/data-table-pagination';
import { DataTableToolbar } from '~/components/table/data-table-toolbar';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table';
import { getMonitors } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';

import { columnsSsh, columnsPing } from './table_columns';
import invariant from 'tiny-invariant';

export const loader = async ({ request, params }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	invariant(params.monitorType, 'Monitor type is required.');
	const monitors = await getMonitors({ type: params.monitorType });
	return json({ monitors, type: params.monitorType });
};

export default function Index() {
	const { monitors, type } = useLoaderData<typeof loader>();
	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({
			caption: false,
			manufacturer: false,
			dnsHostName: false,
			name: false,
			domain: false,
			model: false,
		});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [sorting, setSorting] = React.useState<SortingState>([
		{ id: 'title', desc: false },
	]);

	const table = useReactTable({
		data: monitors,
		columns: type == 'windows' || type == 'ubuntu' ? columnsSsh : columnsPing,
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
		initialState: {
			pagination: {
				pageSize: 25,
			},
		},
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
									<TableRow
										key={row.id}
										className={`cursor-pointer group ${
											row.original.enabled ? '' : 'bg-slate-100/40'
										}`}
										data-state={row.getIsSelected() ? 'selected' : null}
										onClick={() =>
											navigate(`/${row.original.type}/${row.original.id}`)
										}
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
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={
											(type == 'windows' || type == 'ubuntu'
												? columnsSsh
												: columnsPing
											).length
										}
										className="h-24 text-center"
									>
										No results.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<DataTablePagination table={table} pageSizes={[25, 50, 100]} />
			</div>
			<Outlet />
		</>
	);
}
