// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	authenticateMock,
	editDriveMock,
	getDriveMonitorMock,
	deleteDriveMock,
} = vi.hoisted(() => ({
	authenticateMock: vi.fn(),
	editDriveMock: vi.fn(),
	getDriveMonitorMock: vi.fn(),
	deleteDriveMock: vi.fn(),
}));

vi.mock("~/services/auth.server", () => ({
	authenticate: authenticateMock,
}));

vi.mock("~/models/drive.server", () => ({
	editDrive: editDriveMock,
	getDriveMonitor: getDriveMonitorMock,
	deleteDrive: deleteDriveMock,
}));

import { action } from "./route";

describe("drive edit route", () => {
	beforeEach(() => {
		authenticateMock.mockReset();
		editDriveMock.mockReset();
		getDriveMonitorMock.mockReset();
		deleteDriveMock.mockReset();
		authenticateMock.mockResolvedValue({ id: "user-1" });
	});

	it("updates a drive", async () => {
		const drive = { id: "drive-1", enabled: true, title: "Data" };
		editDriveMock.mockResolvedValue(drive);

		const formData = new FormData();
		formData.set("_action", "edit");
		formData.set("id", "drive-1");
		formData.set("title", "Data");
		formData.set("enabled", "true");
		formData.set("description", "null");

		const response = await action({
			request: new Request("http://localhost/drive/edit", {
				method: "POST",
				body: formData,
			}),
			params: {},
			context: {},
		} as never);

		expect(editDriveMock).toHaveBeenCalledWith({
			id: "drive-1",
			title: "Data",
			enabled: true,
			description: null,
		});
		await expect(response.json()).resolves.toEqual({ drive });
	});

	it("deletes a drive and redirects back to the monitor", async () => {
		getDriveMonitorMock.mockResolvedValue({
			monitor: { id: "monitor-1", type: "ubuntu" },
		});
		deleteDriveMock.mockResolvedValue(undefined);

		const formData = new FormData();
		formData.set("_action", "delete");
		formData.set("id", "drive-1");

		const response = await action({
			request: new Request("http://localhost/drive/edit", {
				method: "POST",
				body: formData,
			}),
			params: {},
			context: {},
		} as never);

		expect(deleteDriveMock).toHaveBeenCalledWith({ id: "drive-1" });
		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe("/ubuntu/monitor-1");
	});
});
