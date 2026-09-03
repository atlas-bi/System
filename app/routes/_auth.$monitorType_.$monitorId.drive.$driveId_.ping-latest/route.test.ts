// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticateMock, getDriveLatestFeedsMock } = vi.hoisted(() => ({
	authenticateMock: vi.fn(),
	getDriveLatestFeedsMock: vi.fn(),
}));

vi.mock("~/services/auth.server", () => ({
	authenticate: authenticateMock,
}));

vi.mock("~/models/drive.server", () => ({
	getDriveLatestFeeds: getDriveLatestFeedsMock,
}));

import { loader } from "./route";

const remixArgs = (request: Request, params: Record<string, string>) =>
	({ request, params, context: {} }) as never;

describe("drive ping-latest route", () => {
	beforeEach(() => {
		authenticateMock.mockReset();
		getDriveLatestFeedsMock.mockReset();
		authenticateMock.mockResolvedValue({ id: "user-1" });
	});

	it("returns the latest drive ping feeds", async () => {
		const feeds = [{ id: "feed-1" }];
		getDriveLatestFeedsMock.mockResolvedValue(feeds);

		const response = await loader(
			remixArgs(
				new Request(
					"http://localhost/ubuntu/monitor-1/drive/drive-1/ping-latest",
				),
				{
					driveId: "drive-1",
				},
			),
		);

		expect(getDriveLatestFeedsMock).toHaveBeenCalledWith({ id: "drive-1" });
		await expect(response.json()).resolves.toEqual({ feeds });
	});
});
