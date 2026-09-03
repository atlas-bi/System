// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { getEnabledMonitors, enqueue } = vi.hoisted(() => ({
	getEnabledMonitors: vi.fn(),
	enqueue: vi.fn(),
}));

vi.mock("~/models/monitor.server", () => ({ getEnabledMonitors }));
vi.mock("./monitor.server", () => ({ default: { enqueue } }));

vi.mock("quirrel/remix", () => ({
	CronJob: (_path: string, _schedule: string, handler: () => unknown) =>
		handler,
}));

describe("heartbeat cron job", () => {
	beforeEach(() => {
		getEnabledMonitors.mockReset();
		enqueue.mockReset();
	});

	it("enqueues every enabled monitor", async () => {
		getEnabledMonitors.mockResolvedValue([{ id: "m1" }, { id: "m2" }]);
		const cronHandler = (await import("./heartbeat.server")).default;

		await cronHandler();

		expect(enqueue).toHaveBeenCalledTimes(2);
		expect(enqueue).toHaveBeenNthCalledWith(1, "m1");
		expect(enqueue).toHaveBeenNthCalledWith(2, "m2");
	});

	it("swallows errors from loading enabled monitors", async () => {
		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		getEnabledMonitors.mockRejectedValue(new Error("db unavailable"));
		const cronHandler = (await import("./heartbeat.server")).default;

		await expect(cronHandler()).resolves.toBeUndefined();
		expect(enqueue).not.toHaveBeenCalled();
		expect(consoleSpy).toHaveBeenCalledWith(
			"heartbeat failed.",
			expect.any(Error),
		);

		consoleSpy.mockRestore();
	});
});
