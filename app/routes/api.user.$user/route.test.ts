// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticateMock, getUserBySlugMock } = vi.hoisted(() => ({
	authenticateMock: vi.fn(),
	getUserBySlugMock: vi.fn(),
}));

vi.mock("~/services/auth.server", () => ({
	authenticate: authenticateMock,
}));

vi.mock("~/models/user.server", () => ({
	getUserBySlug: getUserBySlugMock,
}));

import { loader } from "./route";

const remixArgs = (request: Request, params: Record<string, string> = {}) =>
	({ request, params, context: {} }) as never;

describe("api user route", () => {
	beforeEach(() => {
		authenticateMock.mockReset();
		getUserBySlugMock.mockReset();
	});

	it("returns an empty payload when the request is unauthenticated", async () => {
		authenticateMock.mockResolvedValue(null);

		const response = await loader(
			remixArgs(new Request("http://localhost/api/user/jane"), {
				user: "jane",
			}),
		);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({});
		expect(getUserBySlugMock).not.toHaveBeenCalled();
	});

	it("returns the requested user when authenticated", async () => {
		const user = {
			id: "user-1",
			email: "jane@example.com",
			slug: "jane",
			firstName: "Jane",
			lastName: "Doe",
			profilePhoto: null,
		};

		authenticateMock.mockResolvedValue({ id: "viewer-1" });
		getUserBySlugMock.mockResolvedValue(user);

		const response = await loader(
			remixArgs(new Request("http://localhost/api/user/jane"), {
				user: "jane",
			}),
		);

		expect(getUserBySlugMock).toHaveBeenCalledWith("jane");
		await expect(response.json()).resolves.toEqual({ user });
	});
});
