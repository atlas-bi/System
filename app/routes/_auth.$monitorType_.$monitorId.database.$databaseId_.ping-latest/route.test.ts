// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticateMock, getDatabaseLatestFeedsMock } = vi.hoisted(() => ({
	authenticateMock: vi.fn(),
	getDatabaseLatestFeedsMock: vi.fn(),
}));

vi.mock("~/services/auth.server", () => ({
	authenticate: authenticateMock,
}));

vi.mock("~/models/monitor.server", () => ({
	getDatabaseLatestFeeds: getDatabaseLatestFeedsMock,
}));

import { loader } from "./route";

const remixArgs = (request: Request, params: Record<string, string>) =>
	({ request, params, context: {} }) as never;

describe("database ping-latest route", () => {
	beforeEach(() => {
		authenticateMock.mockReset();
		getDatabaseLatestFeedsMock.mockReset();
		authenticateMock.mockResolvedValue({ id: "user-1" });
	});

	it("returns the latest database ping feeds", async () => {
		const feeds = [{ id: "feed-1" }];
		getDatabaseLatestFeedsMock.mockResolvedValue(feeds);

		const response = await loader(
			remixArgs(
				new Request(
					"http://localhost/sqlServer/monitor-1/database/db-1/ping-latest",
				),
				{
					databaseId: "db-1",
				},
			),
		);

		expect(getDatabaseLatestFeedsMock).toHaveBeenCalledWith({ id: "db-1" });
		await expect(response.json()).resolves.toEqual({ feeds });
	});
});
