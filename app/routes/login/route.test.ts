// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	authenticateMock,
	authenticateWithLdapMock,
	getSessionMock,
	commitSessionMock,
} = vi.hoisted(() => ({
	authenticateMock: vi.fn(),
	authenticateWithLdapMock: vi.fn(),
	getSessionMock: vi.fn(),
	commitSessionMock: vi.fn(),
}));

vi.hoisted(() => {
	process.env.SESSION_SECRET = "test-session-secret";
});

vi.mock("~/services/auth.server", () => ({
	authenticate: authenticateMock,
	authenticateWithLdap: authenticateWithLdapMock,
	sessionErrorKey: "auth:error",
}));

vi.mock("~/services/session.server", () => ({
	getSession: getSessionMock,
	commitSession: commitSessionMock,
}));

import { action, loader } from "./route";

const remixArgs = (request: Request) =>
	({ request, params: {}, context: {} }) as never;

describe("login route", () => {
	beforeEach(() => {
		authenticateMock.mockReset();
		authenticateWithLdapMock.mockReset();
		getSessionMock.mockReset();
		commitSessionMock.mockReset();

		authenticateMock.mockResolvedValue(undefined);
		commitSessionMock.mockResolvedValue("session=test");
		getSessionMock.mockResolvedValue({
			get: vi.fn(),
			unset: vi.fn(),
		});
	});

	it("returns session auth errors to the login page", async () => {
		const session = {
			get: vi.fn((key: string) =>
				key === "auth:error" ? "Invalid credentials" : undefined,
			),
			unset: vi.fn(),
		};
		getSessionMock.mockResolvedValue(session);

		const response = await loader(
			remixArgs(new Request("http://localhost/login")),
		);

		await expect(response.json()).resolves.toEqual({
			error: "Invalid credentials",
		});
		expect(session.unset).toHaveBeenCalledWith("auth:error");
	});

	it("rejects invalid email addresses", async () => {
		const response = await action(
			remixArgs(
				new Request("http://localhost/login", {
					method: "POST",
					body: new URLSearchParams({
						email: "not-an-email",
						password: "secret",
					}),
				}),
			),
		);

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "Email is invalid",
		});
	});

	it("requires a password", async () => {
		const response = await action(
			remixArgs(
				new Request("http://localhost/login", {
					method: "POST",
					body: new URLSearchParams({
						email: "user@example.com",
						password: "",
					}),
				}),
			),
		);

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "Password is required",
		});
	});

	it("delegates valid submissions to ldap authentication", async () => {
		const ldapResponse = new Response(null, {
			status: 302,
			headers: { Location: "/dashboard" },
		});
		authenticateWithLdapMock.mockResolvedValue(ldapResponse);

		const request = new Request("http://localhost/login?returnTo=/dashboard", {
			method: "POST",
			body: new URLSearchParams({
				email: "user@example.com",
				password: "secret",
			}),
		});

		await expect(action(remixArgs(request))).resolves.toBe(ldapResponse);
		expect(authenticateWithLdapMock).toHaveBeenCalledWith(request, {
			successRedirect: "/dashboard",
			failureRedirect: "/login",
		});
	});
});
