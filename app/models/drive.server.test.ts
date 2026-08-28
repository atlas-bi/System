// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	findUnique: vi.fn(),
	findFirst: vi.fn(),
	findMany: vi.fn(),
	update: vi.fn(),
	deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
	enqueue: vi.fn(),
}));

vi.mock("~/db.server", () => ({
	prisma: {
		drive: {
			findUnique: mocks.findUnique,
			update: mocks.update,
			deleteMany: mocks.deleteMany,
		},
		driveUsage: {
			findFirst: mocks.findFirst,
			findMany: mocks.findMany,
			deleteMany: mocks.deleteMany,
		},
		monitorLogs: { deleteMany: mocks.deleteMany },
	},
}));

vi.mock("~/queues/searchService.server", () => ({
	default: { enqueue: mocks.enqueue },
}));

import {
	deleteDrive,
	editDrive,
	getDriveLatestFeed,
	getDriveLatestFeeds,
	getDriveMeta,
	getDriveMonitor,
	getDriveNotifications,
	getDriveUsage,
	setDriveOnline,
	setDrivePercFreeSentAt,
	updateDriveNotifications,
} from "./drive.server";

const startDate = new Date("2026-08-01T00:00:00.000Z");
const endDate = new Date("2026-08-28T00:00:00.000Z");

describe("drive.server", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.findUnique.mockResolvedValue({ id: "drive-1" });
		mocks.findFirst.mockResolvedValue({ id: "usage-1" });
		mocks.findMany.mockResolvedValue([{ id: "usage-1" }]);
		mocks.update.mockResolvedValue({ id: "drive-1" });
	});

	it("deletes a drive and reindexes search", async () => {
		await deleteDrive({ id: "drive-1" });

		expect(mocks.deleteMany).toHaveBeenCalledWith({
			where: { drive: { id: "drive-1" } },
		});
		expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { id: "drive-1" } });
		expect(mocks.enqueue).toHaveBeenCalledWith("drive-1");
	});

	it("loads drive metadata and usage", async () => {
		await getDriveMonitor({ id: "drive-1" });
		await getDriveMeta({ id: "drive-1" });
		await getDriveNotifications({ id: "drive-1" });
		await getDriveUsage({ id: "drive-1", startDate, endDate });
		await getDriveLatestFeed({ id: "drive-1" });
		await getDriveLatestFeeds({ id: "drive-1" });

		expect(mocks.findUnique).toHaveBeenCalled();
		expect(mocks.findFirst).toHaveBeenCalled();
		expect(mocks.findMany).toHaveBeenCalled();
	});

	it("updates drive settings and notification timestamps", async () => {
		const sentAt = new Date("2026-08-28T10:00:00.000Z");

		await editDrive({
			id: "drive-1",
			title: "Data",
			description: "Primary",
			enabled: true,
		});
		await updateDriveNotifications({
			id: "drive-1",
			missingNotify: true,
			missingNotifyTypes: ["n1"],
			missingNotifyResendAfterMinutes: 30,
			percFreeNotify: true,
			percFreeNotifyTypes: ["n2"],
			percFreeNotifyResendAfterMinutes: 60,
			percFreeValue: 20,
			sizeFreeNotify: false,
			sizeFreeNotifyTypes: [],
			sizeFreeNotifyResendAfterMinutes: null,
			sizeFreeValue: null,
			growthRateNotify: false,
			growthRateNotifyTypes: [],
			growthRateNotifyResendAfterMinutes: null,
			growthRateValue: null,
		});
		await setDriveOnline({ id: "drive-1", online: true });
		await setDrivePercFreeSentAt({
			id: "drive-1",
			percFreeNotifySentAt: sentAt,
		});

		expect(mocks.update).toHaveBeenCalledTimes(4);
	});
});
