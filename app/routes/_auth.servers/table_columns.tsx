import type { ColumnDef } from '@tanstack/react-table';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { DataTableColumnHeader } from '~/components/table/data-table-column-header';

export const columns: ColumnDef<Task>[] = [
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={table.getIsAllPageRowsSelected()}
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //       className="translate-y-[2px]"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //       className="translate-y-[2px]"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => <div className="">{row.getValue('title')}</div>,
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
    accessorKey: 'serverName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Server Name" />
    ),
    cell: ({ row }) => <div className="">{row.getValue('serverName')}</div>,
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
    accessorKey: 'systemFamily',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="System Family" />
    ),
    cell: ({ row }) => <div className="">{row.getValue('systemFamily')}</div>,
  },
  {
    accessorKey: 'systemType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="System Type" />
    ),
    cell: ({ row }) => <div className="">{row.getValue('SystemType')}</div>,
  },

  // {
  //   accessorKey: "status",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Status" />
  //   ),
  //   cell: ({ row }) => {
  //     const status = statuses.find(
  //       (status) => status.value === row.getValue("status")
  //     )

  //     if (!status) {
  //       return null
  //     }

  //     return (
  //       <div className="flex w-[100px] items-center">
  //         {status.icon && (
  //           <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
  //         )}
  //         <span>{status.label}</span>
  //       </div>
  //     )
  //   },
  //   filterFn: (row, id, value) => {
  //     return value.includes(row.getValue(id))
  //   },
  // },
  // {
  //   accessorKey: "priority",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Priority" />
  //   ),
  //   cell: ({ row }) => {
  //     const priority = priorities.find(
  //       (priority) => priority.value === row.getValue("priority")
  //     )

  //     if (!priority) {
  //       return null
  //     }

  //     return (
  //       <div className="flex items-center">
  //         {priority.icon && (
  //           <priority.icon className="mr-2 h-4 w-4 text-muted-foreground" />
  //         )}
  //         <span>{priority.label}</span>
  //       </div>
  //     )
  //   },
  //   filterFn: (row, id, value) => {
  //     return value.includes(row.getValue(id))
  //   },
  // },
  // {
  //   id: "actions",
  //   cell: ({ row }) => <DataTableRowActions row={row} />,
  // },
];
