// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteMany, findUnique } = vi.hoisted(() => ({
	deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
	findUnique: vi.fn(),
}));

vi.mock("~/db.server", () => ({
	prisma: {
		monitorFeeds: { deleteMany },
		cpuUsage: { deleteMany },
		databaseFileUsage: { deleteMany },
		databaseUsage: { deleteMany },
		driveUsage: { deleteMany },
		appSettings: { findUnique },
	},
}));

vi.mock("quirrel/remix", () => ({
	CronJob: (_path: string, _schedule: string, handler: () => unknown) =>
		handler,
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

describe("retention cron job", () => {
	beforeEach(() => {
		deleteMany.mockClear();
		findUnique.mockReset();
	});

	it("skips cleanup when retention is disabled", async () => {
		findUnique.mockResolvedValue({
			usageRetentionEnabled: false,
			usageRetentionMonths: 6,
		});
		const cronHandler = (await import("./retention.server")).default;

		await cronHandler();

		expect(deleteMany).not.toHaveBeenCalled();
	});

	it("deletes expired usage when retention is enabled", async () => {
		findUnique.mockResolvedValue({
			usageRetentionEnabled: true,
			usageRetentionMonths: 6,
		});
		const cronHandler = (await import("./retention.server")).default;

		await cronHandler();

		expect(deleteMany).toHaveBeenCalledTimes(5);
	});
});
