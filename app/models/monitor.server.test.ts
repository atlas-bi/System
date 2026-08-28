// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteMany, update, enqueue } = vi.hoisted(() => ({
	deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
	update: vi.fn().mockResolvedValue({}),
	enqueue: vi.fn(),
}));

vi.mock("~/db.server", () => ({
	prisma: {
		databaseFileUsage: { deleteMany },
		databaseFile: { deleteMany },
		databaseUsage: { deleteMany },
		database: { deleteMany },
		driveUsage: { deleteMany },
		monitorLogs: { deleteMany },
		drive: { deleteMany },
		monitorFeeds: { deleteMany },
		cpuUsage: { deleteMany },
		cpu: { deleteMany },
		monitor: { update, deleteMany },
	},
}));

vi.mock("~/queues/searchService.server", () => ({ default: { enqueue } }));
vi.mock("~/queues/monitor.server", () => ({ default: { enqueue } }));

import { deleteMonitor } from "./monitor.server";

describe("deleteMonitor", () => {
	beforeEach(() => {
		deleteMany.mockClear();
		update.mockClear();
		enqueue.mockClear();
	});

	it("deletes an HTTP monitor and its dependent records", async () => {
		await deleteMonitor({ id: "http-monitor" });

		expect(deleteMany).toHaveBeenCalledWith({
			where: { cpu: { monitorId: "http-monitor" } },
		});
		expect(update).toHaveBeenCalledWith({
			where: { id: "http-monitor" },
			data: {
				connectionNotifyTypes: { set: [] },
				rebootNotifyTypes: { set: [] },
				httpCertNotifyTypes: { set: [] },
				sqlFileSizePercentFreeNotifyTypes: { set: [] },
			},
		});
		expect(deleteMany).toHaveBeenCalledWith({ where: { id: "http-monitor" } });
		expect(enqueue).toHaveBeenCalledWith("http-monitor");
	});
});
