// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticateMock, getFileUsageLatestMock } = vi.hoisted(() => ({
	authenticateMock: vi.fn(),
	getFileUsageLatestMock: vi.fn(),
}));

vi.mock("~/services/auth.server", () => ({
	authenticate: authenticateMock,
}));

vi.mock("~/models/monitor.server", () => ({
	getFileUsageLatest: getFileUsageLatestMock,
}));

import { loader } from "./route";

const remixArgs = (request: Request, params: Record<string, string>) =>
	({ request, params, context: {} }) as never;

describe("file usage-latest route", () => {
	beforeEach(() => {
		authenticateMock.mockReset();
		getFileUsageLatestMock.mockReset();
		authenticateMock.mockResolvedValue({ id: "user-1" });
	});

	it("returns the latest file usage", async () => {
		const usage = {
			usedSize: 900,
			currentSize: 1000,
			maxSize: 2000,
		};
		getFileUsageLatestMock.mockResolvedValue(usage);

		const response = await loader(
			remixArgs(
				new Request(
					"http://localhost/sqlServer/monitor-1/database/db-1/file/file-1/usage-latest",
				),
				{
					fileId: "file-1",
				},
			),
		);

		expect(getFileUsageLatestMock).toHaveBeenCalledWith({
			databaseFileId: "file-1",
		});
		await expect(response.json()).resolves.toEqual({ usage });
	});
});
