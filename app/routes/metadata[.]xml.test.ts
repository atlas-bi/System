// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("~/services/auth.server", () => ({
	metadata: "<EntityDescriptor>test</EntityDescriptor>",
}));

import { loader } from "./metadata[.]xml";

describe("metadata xml route", () => {
	it("returns SAML metadata as XML", async () => {
		const response = await loader();

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/xml");
		await expect(response.text()).resolves.toBe(
			"<EntityDescriptor>test</EntityDescriptor>",
		);
	});
});
