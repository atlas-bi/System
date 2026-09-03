// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticateMock, getMonitorLatestFeedsMock } = vi.hoisted(() => ({
	authenticateMock: vi.fn(),
	getMonitorLatestFeedsMock: vi.fn(),
}));

vi.mock("~/services/auth.server", () => ({
	authenticate: authenticateMock,
}));

vi.mock("~/models/monitor.server", () => ({
	getMonitorLatestFeeds: getMonitorLatestFeedsMock,
}));

import { loader } from "./route";

const remixArgs = (request: Request, params: Record<string, string>) =>
	({ request, params, context: {} }) as never;

describe("ping-latest route", () => {
	beforeEach(() => {
		authenticateMock.mockReset();
		getMonitorLatestFeedsMock.mockReset();
		authenticateMock.mockResolvedValue({ id: "user-1" });
	});

	it("returns the latest monitor ping feeds", async () => {
		const feeds = [{ id: "feed-1" }, { id: "feed-2" }];
		getMonitorLatestFeedsMock.mockResolvedValue(feeds);

		const response = await loader(
			remixArgs(new Request("http://localhost/http/monitor-1/ping-latest"), {
				monitorId: "monitor-1",
			}),
		);

		expect(getMonitorLatestFeedsMock).toHaveBeenCalledWith({
			id: "monitor-1",
		});
		await expect(response.json()).resolves.toEqual({ feeds });
	});
});
