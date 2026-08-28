// @vitest-environment node

import { beforeEach, describe, expect, it } from "vitest";
import { cn, decrypt, encrypt, jsonParser } from "./utils";

describe("lib/utils", () => {
	beforeEach(() => {
		process.env.PASS_KEY = "01234567890123456789012345678901";
	});

	it("merges class names", () => {
		expect(cn("px-2", "px-4", false && "hidden", "text-sm")).toBe(
			"px-4 text-sm",
		);
	});

	it("round-trips encrypted values", () => {
		const secret = encrypt("monitor-password");
		expect(decrypt(secret)).toBe("monitor-password");
	});

	it("returns the original string when json parsing fails", () => {
		expect(jsonParser("{not-json")).toBe("{not-json");
		expect(jsonParser('{"ok":true}')).toEqual({ ok: true });
	});
});
