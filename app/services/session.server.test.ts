// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
	process.env.SESSION_SECRET = "test-session-secret";
});

const getUserByIdMock = vi.hoisted(() => vi.fn());

vi.mock("~/models/user.server", () => ({
	getUserById: getUserByIdMock,
}));

import {
	commitSession,
	createUserSession,
	getSession,
	getUser,
	getUserId,
	logout,
	requireUser,
	requireUserId,
} from "./session.server";

async function requestWithSession(values: Record<string, string>) {
	const session = await getSession(new Request("http://localhost/private"));
	for (const [key, value] of Object.entries(values)) {
		session.set(key, value);
	}

	return new Request("http://localhost/private", {
		headers: {
			Cookie: await commitSession(session),
		},
	});
}

describe("session.server", () => {
	beforeEach(() => {
		getUserByIdMock.mockReset();
	});

	it("redirects unauthenticated users to login", async () => {
		const response = await requireUserId(
			new Request("http://localhost/private"),
		).catch((error) => error);

		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe(
			"/login?redirectTo=%2Fprivate",
		);
	});

	it("returns the user id from the session cookie", async () => {
		const request = await requestWithSession({ userId: "user-1" });

		await expect(requireUserId(request)).resolves.toBe("user-1");
	});

	it("returns null when no user id is stored", async () => {
		await expect(
			getUserId(new Request("http://localhost/private")),
		).resolves.toBeUndefined();
		await expect(
			getUser(new Request("http://localhost/private")),
		).resolves.toBeNull();
	});

	it("loads the user when a valid session exists", async () => {
		const request = await requestWithSession({ userId: "user-1" });
		getUserByIdMock.mockResolvedValue({
			id: "user-1",
			email: "jane@example.com",
		});

		await expect(getUserId(request)).resolves.toBe("user-1");
		await expect(getUser(request)).resolves.toEqual({
			id: "user-1",
			email: "jane@example.com",
		});
	});

	it("requires an authenticated user record", async () => {
		const request = await requestWithSession({ userId: "missing-user" });
		getUserByIdMock.mockResolvedValue(null);

		const response = await requireUser(request).catch((error) => error);

		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(302);
	});

	it("creates a session and redirects after login", async () => {
		const request = new Request("http://localhost/login");
		const response = await createUserSession({
			request,
			userId: "user-1",
			remember: true,
			redirectTo: "/",
		});

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe("/");
		expect(response.headers.get("Set-Cookie")).toContain("__session=");
	});

	it("destroys the session on logout", async () => {
		const request = await requestWithSession({ userId: "user-1" });
		const response = await logout(request);

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe("/");
		expect(response.headers.get("Set-Cookie")).toContain("__session=;");
	});
});
