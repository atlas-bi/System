// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticateMock, getMonitorLatestFeedMock } = vi.hoisted(() => ({
	authenticateMock: vi.fn(),
	getMonitorLatestFeedMock: vi.fn(),
}));

vi.mock("~/services/auth.server", () => ({
	authenticate: authenticateMock,
}));

vi.mock("~/models/monitor.server", () => ({
	getMonitorLatestFeed: getMonitorLatestFeedMock,
}));

import { loader } from "./route";

const remixArgs = (request: Request, params: Record<string, string>) =>
	({ request, params, context: {} }) as never;

describe("feed-latest route", () => {
	beforeEach(() => {
		authenticateMock.mockReset();
		getMonitorLatestFeedMock.mockReset();
		authenticateMock.mockResolvedValue({ id: "user-1" });
	});

	it("returns the latest monitor feed", async () => {
		const feed = { id: "feed-1", createdAt: "2026-08-28T10:00:00.000Z" };
		getMonitorLatestFeedMock.mockResolvedValue([feed]);

		const response = await loader(
			remixArgs(new Request("http://localhost/http/monitor-1/feed-latest"), {
				monitorId: "monitor-1",
			}),
		);

		expect(getMonitorLatestFeedMock).toHaveBeenCalledWith({ id: "monitor-1" });
		await expect(response.json()).resolves.toEqual({ feed });
	});
});
