// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticateMock, getDriveUsageMock } = vi.hoisted(() => ({
	authenticateMock: vi.fn(),
	getDriveUsageMock: vi.fn(),
}));

vi.mock("~/services/auth.server", () => ({
	authenticate: authenticateMock,
}));

vi.mock("~/models/drive.server", () => ({
	getDriveUsage: getDriveUsageMock,
}));

import { loader } from "./route";

const remixArgs = (request: Request, params: Record<string, string>) =>
	({ request, params, context: {} }) as never;

describe("drive usage route", () => {
	beforeEach(() => {
		authenticateMock.mockReset();
		getDriveUsageMock.mockReset();
		authenticateMock.mockResolvedValue({ id: "user-1" });
	});

	it("returns the latest reading when the request has no range", async () => {
		const older = new Date(Date.now() - 60 * 60 * 1000);
		const newer = new Date();
		getDriveUsageMock.mockResolvedValue({
			id: "drive-1",
			size: "128849018880",
			usage: [
				{
					id: "new",
					free: "19112604467",
					used: "109136414413",
					createdAt: newer,
				},
				{
					id: "old",
					free: "4788880998",
					used: "123460137882",
					createdAt: older,
				},
			],
		});

		const response = await loader(
			remixArgs(
				new Request("http://localhost/iis/monitor-1/drive/drive-1/usage"),
				{ driveId: "drive-1" },
			),
		);
		const body = await response.json();

		expect(body.drive.usage).toHaveLength(2);
		expect(body.drive.usage[0].used).toBe("109136414413");
		expect(body.drive.usage[0].free).toBe("19112604467");
	});
});
