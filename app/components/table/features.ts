import {
	createFacetedRowModel,
	createFacetedUniqueValues,
	createFilteredRowModel,
	createPaginatedRowModel,
	createSortedRowModel,
	filterFns,
	sortFns,
	stockFeatures,
	tableFeatures,
} from "@tanstack/react-table";

/**
 * Client-side table features used across Atlas data tables.
 * Row models and fn registries are explicit slots in v9 (not get*RowModel options).
 */
export const dataTableFeatures = tableFeatures({
	...stockFeatures,
	filteredRowModel: createFilteredRowModel(),
	sortedRowModel: createSortedRowModel(),
	paginatedRowModel: createPaginatedRowModel(),
	facetedRowModel: createFacetedRowModel(),
	facetedUniqueValues: createFacetedUniqueValues(),
	filterFns,
	sortFns,
});

export type DataTableFeatures = typeof dataTableFeatures;
