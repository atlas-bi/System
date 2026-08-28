// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

const enqueue = vi.hoisted(() => vi.fn());

vi.mock("./searchService.server", () => ({ default: { enqueue } }));

vi.mock("quirrel/remix", () => ({
	CronJob: (_path: string, _schedule: string, handler: () => unknown) =>
		handler,
}));

describe("search cron job", () => {
	it("enqueues a search reload", async () => {
		const cronHandler = (await import("./search.server")).default;

		await cronHandler();

		expect(enqueue).toHaveBeenCalledWith("load");
	});
});
