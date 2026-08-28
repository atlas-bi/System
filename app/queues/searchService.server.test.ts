// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getSearchData: vi.fn(),
	deleteAllDocuments: vi.fn(),
	updateSearchableAttributes: vi.fn(),
	updateDisplayedAttributes: vi.fn(),
	addDocuments: vi.fn().mockResolvedValue({ taskUid: 1 }),
}));

vi.mock("~/models/search.server", () => ({
	getSearchData: mocks.getSearchData,
}));

vi.mock("quirrel/remix", () => ({
	Queue: (_path: string, handler: () => unknown) => handler,
}));

vi.mock("meilisearch", () => ({
	Meilisearch: class {
		index() {
			return {
				deleteAllDocuments: mocks.deleteAllDocuments,
				updateSearchableAttributes: mocks.updateSearchableAttributes,
				updateDisplayedAttributes: mocks.updateDisplayedAttributes,
				addDocuments: mocks.addDocuments,
			};
		}
	},
}));

describe("searchService queue", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getSearchData.mockResolvedValue([
			{ id: "monitor-1", title: "Example" },
		]);
		delete process.env.MEILISEARCH_URL;
	});

	it("skips indexing when Meilisearch is not configured", async () => {
		const handler = (await import("./searchService.server")).default;

		await handler();

		expect(mocks.getSearchData).not.toHaveBeenCalled();
	});

	it("reloads the search index when Meilisearch is configured", async () => {
		process.env.MEILISEARCH_URL = "localhost:7700";
		process.env.MEILI_MASTER_KEY = "master-key";
		const handler = (await import("./searchService.server")).default;

		await handler();

		expect(mocks.deleteAllDocuments).toHaveBeenCalled();
		expect(mocks.getSearchData).toHaveBeenCalled();
		expect(mocks.addDocuments).toHaveBeenCalledWith([
			{ id: "monitor-1", title: "Example" },
		]);
	});
});
