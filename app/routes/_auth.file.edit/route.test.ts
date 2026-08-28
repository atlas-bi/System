// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticateMock, editFileMock } = vi.hoisted(() => ({
	authenticateMock: vi.fn(),
	editFileMock: vi.fn(),
}));

vi.mock("~/services/auth.server", () => ({
	authenticate: authenticateMock,
}));

vi.mock("~/models/monitor.server", () => ({
	editFile: editFileMock,
}));

import { action } from "./route";

describe("file edit route", () => {
	beforeEach(() => {
		authenticateMock.mockReset();
		editFileMock.mockReset();
		authenticateMock.mockResolvedValue({ id: "user-1" });
	});

	it("updates a database file", async () => {
		const file = { id: "file-1", enabled: false };
		editFileMock.mockResolvedValue(file);

		const formData = new FormData();
		formData.set("_action", "edit");
		formData.set("id", "file-1");
		formData.set("enabled", "false");

		const response = await action({
			request: new Request("http://localhost/file/edit", {
				method: "POST",
				body: formData,
			}),
			params: {},
			context: {},
		} as never);

		expect(editFileMock).toHaveBeenCalledWith({
			id: "file-1",
			enabled: false,
		});
		await expect(response.json()).resolves.toEqual({ file });
	});
});
