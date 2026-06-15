// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { authenticate } from "./auth.server";
import { commitSession, getSession } from "./session.server";

vi.hoisted(() => {
	process.env.SESSION_SECRET = "test-session-secret";
});

vi.mock("~/models/user.server", () => ({
	SlimUserFields: {},
	updateUserProps: vi.fn(),
}));

const user = {
	id: "user-1",
	email: "user@example.com",
	firstName: "Test",
	lastName: "User",
	groups: [],
	profilePhoto: null,
};

async function requestWithUser(url = "http://localhost/private") {
	const session = await getSession(new Request(url));
	session.set("user", user);
	return new Request(url, {
		headers: {
			Cookie: await commitSession(session),
		},
	});
}

describe("authenticate", () => {
	async function getRedirectResponse(action: Promise<unknown>) {
		const response = await action.catch((error) => error);
		expect(response).toBeInstanceOf(Response);
		return response as Response;
	}

	it("returns the user stored in the auth session", async () => {
		await expect(authenticate(await requestWithUser())).resolves.toEqual(user);
	});

	it("redirects to the failure URL when the user is not authenticated", async () => {
		const response = await getRedirectResponse(
			authenticate(new Request("http://localhost/private"), {
				failureRedirect: "/auth/?returnTo=%2Fprivate",
			}),
		);

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe("/auth/?returnTo=%2Fprivate");
	});

	it("redirects to the success URL when an authenticated user visits login", async () => {
		const response = await getRedirectResponse(
			authenticate(await requestWithUser("http://localhost/login"), {
				successRedirect: "/",
			}),
		);

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe("/");
	});

	it("returns null when no redirect is configured and no user is authenticated", async () => {
		await expect(
			authenticate(new Request("http://localhost/private"), {
				failureRedirect: undefined,
			}),
		).resolves.toBeNull();
	});
});
