// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticateMock, getMonitorTypesMock } = vi.hoisted(() => ({
	authenticateMock: vi.fn(),
	getMonitorTypesMock: vi.fn(),
}));

vi.mock("~/services/auth.server", () => ({
	authenticate: authenticateMock,
}));

vi.mock("~/models/monitor.server", () => ({
	getMonitorTypes: getMonitorTypesMock,
}));

import { loader } from "./route";

const remixArgs = (request: Request) =>
	({ request, params: {}, context: {} }) as never;

describe("auth index loader", () => {
	beforeEach(() => {
		authenticateMock.mockReset();
		getMonitorTypesMock.mockReset();
		authenticateMock.mockResolvedValue({ id: "user-1" });
	});

	it("redirects to the first monitor type when monitors exist", async () => {
		getMonitorTypesMock.mockResolvedValue([{ type: "http" }, { type: "tcp" }]);

		const response = await loader(remixArgs(new Request("http://localhost/")));

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe("/http");
	});

	it("renders the empty state when no monitors exist", async () => {
		getMonitorTypesMock.mockResolvedValue([]);

		await expect(
			loader(remixArgs(new Request("http://localhost/"))),
		).resolves.toBeNull();
	});
});
