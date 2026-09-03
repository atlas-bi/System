// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { getLatestMonitorLog, monitorLog } = vi.hoisted(() => ({
	getLatestMonitorLog: vi.fn(),
	monitorLog: vi.fn(),
}));

vi.mock("~/models/monitor.server", () => ({
	getLatestMonitorLog,
	monitorLog,
}));

import { Logger } from "./logger";

describe("Logger", () => {
	beforeEach(() => {
		getLatestMonitorLog.mockReset();
		monitorLog.mockReset();
	});

	it("creates a log when the message changed", async () => {
		getLatestMonitorLog.mockResolvedValue({ message: "old message" });

		await Logger({
			message: "new message",
			type: "error",
			monitor: { id: "monitor-1" },
		});

		expect(monitorLog).toHaveBeenCalledWith({
			monitorId: "monitor-1",
			type: "error",
			message: "new message",
			driveId: null,
			databaseId: null,
			fileId: null,
		});
	});

	it("skips duplicate consecutive messages", async () => {
		getLatestMonitorLog.mockResolvedValue({ message: "same message" });

		await Logger({
			message: "same message",
			type: "error",
			monitor: { id: "monitor-1" },
		});

		expect(monitorLog).not.toHaveBeenCalled();
	});
});
