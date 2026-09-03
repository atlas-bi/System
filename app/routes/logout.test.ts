// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

const logoutMock = vi.hoisted(() => vi.fn());

vi.mock("~/services/session.server", () => ({
	logout: logoutMock,
}));

import { action, loader } from "./logout";

describe("logout route", () => {
	it("delegates POST requests to session logout", async () => {
		const request = new Request("http://localhost/logout", { method: "POST" });
		const response = new Response(null, { status: 302 });

		logoutMock.mockResolvedValue(response);

		await expect(
			action({ request, params: {}, context: {} } as never),
		).resolves.toBe(response);
		expect(logoutMock).toHaveBeenCalledWith(request);
	});

	it("delegates GET requests to session logout", async () => {
		const request = new Request("http://localhost/logout");
		const response = new Response(null, { status: 302 });

		logoutMock.mockResolvedValue(response);

		await expect(
			loader({ request, params: {}, context: {} } as never),
		).resolves.toBe(response);
		expect(logoutMock).toHaveBeenCalledWith(request);
	});
});
