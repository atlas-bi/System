// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

const logoutMock = vi.hoisted(() => vi.fn());

vi.mock("~/services/session.server", () => ({
	logout: logoutMock,
}));

import { action } from "./route";

describe("auth slo route", () => {
	it("delegates logout requests to session logout", async () => {
		const request = new Request("http://localhost/auth/slo", {
			method: "POST",
		});
		const response = new Response(null, { status: 302 });

		logoutMock.mockResolvedValue(response);

		await expect(
			action({ request, params: {}, context: {} } as never),
		).resolves.toBe(response);
		expect(logoutMock).toHaveBeenCalledWith(request);
	});
});
