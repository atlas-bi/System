'use client';

import * as React from 'react';
import {
	ColumnDef,
	ColumnFiltersState,
	PaginationState,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table';

import { columns } from './columns';
import { H3 } from '../ui/typography';
import { LogTablePagination } from './pagination';
import { useEffect } from 'react';
import { useFetcher } from '@remix-run/react';

export function LogTable({ url }: { url: string }) {
	const logsFetcher = useFetcher();

	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [{ pageIndex, pageSize }, setPagination] =
		React.useState<PaginationState>({
			pageIndex: 0,
			pageSize: 10,
		});
	const [sorting, setSorting] = React.useState<SortingState>([]);

	const [data, setData] = React.useState([]);
	const [pages, setPages] = React.useState(-1);

	// rerun on url change
	useEffect(
		() => logsFetcher.load(`${url}?page=${pageIndex}&size=${pageSize}`),
		[url],
	);

	// Get fresh data every 30 seconds.
	useEffect(() => {
		const interval = setInterval(() => {
			if (document.visibilityState === 'visible') {
				logsFetcher.load(`${url}?page=${pageIndex}&size=${pageSize}`);
			}
		}, 30 * 1000);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		logsFetcher.load(`${url}?page=${pageIndex}&size=${pageSize}`);
	}, [pageIndex, pageSize]);

	useEffect(() => {
		if (logsFetcher.state === 'idle' && logsFetcher.data) {
			setData(logsFetcher.data.data.logs);
			setPages(logsFetcher.data.data.pages);
		}
	}, [logsFetcher]);

	const pagination = React.useMemo(
		() => ({
			pageIndex,
			pageSize,
		}),
		[pageIndex, pageSize],
	);
	const defaultData = React.useMemo(() => [], []);

	const table = useReactTable({
		data: data ?? defaultData,
		pageCount: pages ?? -1,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination,
		},
		enableRowSelection: true,
		manualPagination: true,
		onPaginationChange: setPagination,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		// getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	return (
		<div className="space-y-4">
			<H3>Logs</H3>
			{/*<DataTableToolbar table={table} />*/}
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
									data-state={row.getIsSelected() && 'selected'}
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
			<LogTablePagination table={table} />
		</div>
	);
}
