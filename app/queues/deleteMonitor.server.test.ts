// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const queueMock = vi.fn(
	(_name: string, handler: (job: string) => Promise<void>) => {
		return handler;
	},
);
const deleteMonitorMock = vi.fn();

vi.mock("quirrel/remix", () => ({
	Queue: queueMock,
}));

vi.mock("~/models/monitor.server", () => ({
	deleteMonitor: deleteMonitorMock,
}));

describe("delete monitor queue", () => {
	beforeEach(() => {
		queueMock.mockClear();
		deleteMonitorMock.mockReset();
	});

	it("deletes the queued monitor", async () => {
		const queueHandler = (await import("./deleteMonitor.server")).default;

		await queueHandler("monitor-1");

		expect(queueMock).toHaveBeenCalledWith(
			"queues/deleteMonitor",
			expect.any(Function),
		);
		expect(deleteMonitorMock).toHaveBeenCalledWith({ id: "monitor-1" });
	});
});
