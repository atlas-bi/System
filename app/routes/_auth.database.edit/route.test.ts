// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticateMock, editDatabaseMock } = vi.hoisted(() => ({
	authenticateMock: vi.fn(),
	editDatabaseMock: vi.fn(),
}));

vi.mock("~/services/auth.server", () => ({
	authenticate: authenticateMock,
}));

vi.mock("~/models/monitor.server", () => ({
	editDatabase: editDatabaseMock,
}));

import { action } from "./route";

describe("database edit route", () => {
	beforeEach(() => {
		authenticateMock.mockReset();
		editDatabaseMock.mockReset();
		authenticateMock.mockResolvedValue({ id: "user-1" });
	});

	it("updates a database", async () => {
		const database = { id: "db-1", enabled: false, title: "Atlas" };
		editDatabaseMock.mockResolvedValue(database);

		const formData = new FormData();
		formData.set("_action", "edit");
		formData.set("id", "db-1");
		formData.set("title", "Atlas");
		formData.set("enabled", "false");
		formData.set("description", "Primary database");

		const response = await action({
			request: new Request("http://localhost/database/edit", {
				method: "POST",
				body: formData,
			}),
			params: {},
			context: {},
		} as never);

		expect(editDatabaseMock).toHaveBeenCalledWith({
			id: "db-1",
			title: "Atlas",
			enabled: false,
			description: "Primary database",
		});
		await expect(response.json()).resolves.toEqual({ database });
	});
});
