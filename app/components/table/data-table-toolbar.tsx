'use client';

import {
	ArrowDownIcon,
	ArrowRightIcon,
	ArrowUpIcon,
	CheckCircledIcon,
	CircleIcon,
	Cross2Icon,
	CrossCircledIcon,
	QuestionMarkCircledIcon,
	StopwatchIcon,
} from '@radix-ui/react-icons';
import type { Table } from '@tanstack/react-table';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';

// import { priorities, statuses } from "../data/data"
import { DataTableFacetedFilter } from './data-table-faceted-filter';
import { DataTableViewOptions } from './data-table-view-options';

interface DataTableToolbarProps<TData> {
	table: Table<TData>;
}

export const statuses = [
	{
		value: 'backlog',
		label: 'Backlog',
		icon: QuestionMarkCircledIcon,
	},
	{
		value: 'todo',
		label: 'Todo',
		icon: CircleIcon,
	},
	{
		value: 'in progress',
		label: 'In Progress',
		icon: StopwatchIcon,
	},
	{
		value: 'done',
		label: 'Done',
		icon: CheckCircledIcon,
	},
	{
		value: 'canceled',
		label: 'Canceled',
		icon: CrossCircledIcon,
	},
];

export const priorities = [
	{
		label: 'Low',
		value: 'low',
		icon: ArrowDownIcon,
	},
	{
		label: 'Medium',
		value: 'medium',
		icon: ArrowRightIcon,
	},
	{
		label: 'High',
		value: 'high',
		icon: ArrowUpIcon,
	},
];

export function DataTableToolbar<TData>({
	table,
}: DataTableToolbarProps<TData>) {
	const isFiltered = table.getState().columnFilters.length > 0;

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 items-center space-x-2">
				<Input
					placeholder="Filter..."
					value={(table.getAllColumns()?.[0]?.getFilterValue() as string) ?? ''}
					onChange={(event) =>
						table.getAllColumns()?.[0]?.setFilterValue(event.target.value)
					}
					className="h-8 w-[150px] lg:w-[250px]"
				/>
				{/*{table.getColumn('status') ? (
          <DataTableFacetedFilter
            column={table.getColumn('status')}
            title="Status"
            options={statuses}
          />
        ) : null}
        {table.getColumn('priority') ? (
          <DataTableFacetedFilter
            column={table.getColumn('priority')}
            title="Priority"
            options={priorities}
          />
        ) : null}*/}
				{isFiltered ? (
					<Button
						variant="ghost"
						onClick={() => table.resetColumnFilters()}
						className="h-8 px-2 lg:px-3"
					>
						Reset
						<Cross2Icon className="ml-2 h-4 w-4" />
					</Button>
				) : null}
			</div>
			<DataTableViewOptions table={table} />
		</div>
	);
}
