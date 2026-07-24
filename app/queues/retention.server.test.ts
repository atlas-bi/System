// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteMany } = vi.hoisted(() => ({
	deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
}));

vi.mock("~/db.server", () => ({
	prisma: {
		monitorFeeds: { deleteMany },
		cpuUsage: { deleteMany },
		databaseFileUsage: { deleteMany },
		databaseUsage: { deleteMany },
		driveUsage: { deleteMany },
		appSettings: { findUnique: vi.fn() },
	},
}));

vi.mock("quirrel/remix", () => ({
	CronJob: (_path: string, _schedule: string, handler: () => unknown) => handler,
}));

import { deleteExpiredUsageData } from "./retention.server";

describe("deleteExpiredUsageData", () => {
	beforeEach(() => deleteMany.mockClear());

	it("deletes records older than the cutoff from every telemetry table", async () => {
		const cutoff = new Date("2026-07-24T00:00:00.000Z");

		await deleteExpiredUsageData(cutoff);

		expect(deleteMany).toHaveBeenCalledTimes(5);
		expect(deleteMany).toHaveBeenNthCalledWith(1, {
			where: { createdAt: { lt: cutoff } },
		});
		expect(deleteMany).toHaveBeenNthCalledWith(5, {
			where: { createdAt: { lt: cutoff } },
		});
	});
});
