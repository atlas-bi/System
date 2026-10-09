import { describe, expect, it } from "vitest";
import { isReboot, resolveBootTime } from "./bootTime";

describe("boot time drift", () => {
	it("ignores minute-scale host reporting drift", () => {
		const previous = "2026-10-09T01:18:33.502Z";
		const next = "2026-10-09T01:51:04.500Z";

		expect(isReboot(previous, next)).toBe(false);
		expect(resolveBootTime(previous, next)).toBe(
			new Date(previous).toISOString(),
		);
	});

	it("keeps a boot time that jumps backward", () => {
		const previous = "2026-10-09T01:51:04.500Z";
		const next = "2026-10-09T01:18:33.502Z";

		expect(isReboot(previous, next)).toBe(false);
		expect(resolveBootTime(previous, next)).toBe(
			new Date(previous).toISOString(),
		);
	});

	it("accepts a boot time that moved forward by hours", () => {
		const previous = "2026-10-08T01:18:33.502Z";
		const next = "2026-10-09T12:30:00.000Z";

		expect(isReboot(previous, next)).toBe(true);
		expect(resolveBootTime(previous, next)).toBe(new Date(next).toISOString());
	});
});
