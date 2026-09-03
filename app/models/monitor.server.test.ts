// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	findUnique: vi.fn(),
	findFirst: vi.fn(),
	findMany: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
	groupBy: vi.fn(),
	count: vi.fn(),
	transaction: vi.fn(),
	enqueue: vi.fn(),
	encrypt: vi.fn((value: string) => `encrypted:${value}`),
}));

vi.mock("@/lib/utils", () => ({
	encrypt: mocks.encrypt,
}));

vi.mock("~/db.server", () => ({
	prisma: {
		monitor: {
			findUnique: mocks.findUnique,
			findFirst: mocks.findFirst,
			findMany: mocks.findMany,
			create: mocks.create,
			update: mocks.update,
			deleteMany: mocks.deleteMany,
			groupBy: mocks.groupBy,
		},
		database: {
			findUnique: mocks.findUnique,
			findMany: mocks.findMany,
			update: mocks.update,
			deleteMany: mocks.deleteMany,
		},
		databaseFile: {
			findUnique: mocks.findUnique,
			findMany: mocks.findMany,
			update: mocks.update,
			deleteMany: mocks.deleteMany,
		},
		databaseFileUsage: {
			findFirst: mocks.findFirst,
			deleteMany: mocks.deleteMany,
		},
		databaseUsage: {
			findMany: mocks.findMany,
			deleteMany: mocks.deleteMany,
		},
		drive: {
			findMany: mocks.findMany,
			deleteMany: mocks.deleteMany,
		},
		driveUsage: { deleteMany: mocks.deleteMany },
		monitorLogs: {
			create: mocks.create,
			findFirst: mocks.findFirst,
			findMany: mocks.findMany,
			count: mocks.count,
			deleteMany: mocks.deleteMany,
		},
		monitorFeeds: {
			findMany: mocks.findMany,
			update: mocks.update,
			deleteMany: mocks.deleteMany,
		},
		cpuUsage: { deleteMany: mocks.deleteMany },
		cpu: { deleteMany: mocks.deleteMany },
		$transaction: mocks.transaction,
	},
}));

vi.mock("~/queues/searchService.server", () => ({
	default: { enqueue: mocks.enqueue },
}));
vi.mock("~/queues/monitor.server", () => ({
	default: { enqueue: mocks.enqueue },
}));

import {
	createMonitor,
	deleteMonitor,
	editDatabase,
	editFile,
	editMonitor,
	getCpuUsage,
	getDatabaseFile,
	getDatabaseLatestFeeds,
	getDatabaseMemoryUsage,
	getDatabaseMeta,
	getDatabaseUsage,
	getEnabledMonitors,
	getFileNotifications,
	getFileUsage,
	getFileUsageLatest,
	getLatestMonitorLog,
	getMemoryUsage,
	getMonitor,
	getMonitorBootTime,
	getMonitorDatabases,
	getMonitorDisabledDatabases,
	getMonitorDisabledDrives,
	getMonitorDrives,
	getMonitorLatestFeed,
	getMonitorLatestFeeds,
	getMonitorLogs,
	getMonitorMeta,
	getMonitorNotifications,
	getMonitors,
	getMonitorTypes,
	getPing,
	monitorError,
	monitorLog,
	setFeedError,
	setFileDays,
	setFileGrowth,
	setFilePercFreeSentAt,
	setMonitorConnectionRetried,
	setMonitorConnectionSentAt,
	setMonitorHttpCertSentAt,
	setMonitorRebootSentAt,
	updateMonitor,
	updateMonitorNotifications,
} from "./monitor.server";

const startDate = new Date("2026-08-01T00:00:00.000Z");
const endDate = new Date("2026-08-28T00:00:00.000Z");

describe("monitor.server", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.findUnique.mockResolvedValue({ id: "monitor-1" });
		mocks.findFirst.mockResolvedValue({ id: "feed-1" });
		mocks.findMany.mockResolvedValue([{ id: "monitor-1" }]);
		mocks.create.mockResolvedValue({ id: "monitor-1", type: "http" });
		mocks.update.mockResolvedValue({ id: "monitor-1", type: "http" });
		mocks.groupBy.mockResolvedValue([{ type: "http", _count: { type: 2 } }]);
		mocks.count.mockResolvedValue(12);
		mocks.transaction.mockImplementation((operations: Promise<unknown>[]) =>
			Promise.all(operations),
		);
	});

	describe("deleteMonitor", () => {
		it("deletes dependent records and enqueues search reindexing", async () => {
			await deleteMonitor({ id: "http-monitor" });

			expect(mocks.deleteMany).toHaveBeenCalledWith({
				where: { cpu: { monitorId: "http-monitor" } },
			});
			expect(mocks.update).toHaveBeenCalledWith({
				where: { id: "http-monitor" },
				data: {
					connectionNotifyTypes: { set: [] },
					rebootNotifyTypes: { set: [] },
					httpCertNotifyTypes: { set: [] },
					sqlFileSizePercentFreeNotifyTypes: { set: [] },
				},
			});
			expect(mocks.deleteMany).toHaveBeenCalledWith({
				where: { id: "http-monitor" },
			});
			expect(mocks.enqueue).toHaveBeenCalledWith("http-monitor");
		});
	});

	describe("createMonitor", () => {
		it("encrypts secrets and enqueues enabled monitors", async () => {
			await createMonitor({
				title: "Example",
				host: "example.com",
				username: null,
				password: "secret",
				privateKey: null,
				port: null,
				type: "http",
				description: null,
				enabled: true,
				httpUrl: "https://example.com",
				httpIgnoreSsl: false,
				httpCheckCert: true,
				httpAcceptedStatusCodes: "200s",
				httpMaxRedirects: 5,
				httpRequestMethod: "GET",
				httpBodyEncoding: null,
				httpBody: null,
				httpHeaders: null,
				httpAuthentication: null,
				httpUsername: null,
				httpPassword: "http-secret",
				httpDomain: null,
				httpWorkstation: null,
				sqlConnectionString: null,
				sqlDisableDbMemory: false,
			});

			expect(mocks.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					password: "encrypted:secret",
					httpPassword: "encrypted:http-secret",
				}),
				select: { id: true, type: true },
			});
			expect(mocks.enqueue).toHaveBeenCalledWith("monitor-1");
		});

		it("does not enqueue disabled monitors for collection", async () => {
			await createMonitor({
				title: "Example",
				host: "example.com",
				username: null,
				password: null,
				privateKey: null,
				port: null,
				type: "tcp",
				description: null,
				enabled: false,
				httpUrl: null,
				httpIgnoreSsl: false,
				httpCheckCert: false,
				httpAcceptedStatusCodes: null,
				httpMaxRedirects: null,
				httpRequestMethod: null,
				httpBodyEncoding: null,
				httpBody: null,
				httpHeaders: null,
				httpAuthentication: null,
				httpUsername: null,
				httpPassword: null,
				httpDomain: null,
				httpWorkstation: null,
				sqlConnectionString: null,
				sqlDisableDbMemory: false,
			});

			expect(mocks.enqueue).toHaveBeenCalledTimes(1);
		});
	});

	describe("editMonitor", () => {
		it("updates monitor settings and re-enqueues collection", async () => {
			await editMonitor({
				id: "monitor-1",
				title: "Updated",
				host: "example.com",
				username: null,
				password: null,
				privateKey: null,
				port: 443,
				type: "http",
				description: null,
				enabled: true,
				httpUrl: "https://example.com",
				httpIgnoreSsl: false,
				httpCheckCert: true,
				httpAcceptedStatusCodes: "200s",
				httpMaxRedirects: 5,
				httpRequestMethod: "GET",
				httpBodyEncoding: null,
				httpBody: null,
				httpHeaders: null,
				httpAuthentication: null,
				httpUsername: null,
				httpPassword: null,
				httpDomain: null,
				httpWorkstation: null,
				sqlConnectionString: "Server=localhost;",
				sqlDisableDbMemory: false,
			});

			expect(mocks.update).toHaveBeenCalledWith({
				where: { id: "monitor-1" },
				data: expect.objectContaining({
					sqlConnectionString: "encrypted:Server=localhost;",
				}),
				select: { id: true, type: true },
			});
			expect(mocks.enqueue).toHaveBeenCalledWith("monitor-1");
		});
	});

	describe("read helpers", () => {
		it("loads monitor metadata and relations", async () => {
			await getMonitorMeta({ id: "monitor-1" });
			await getMonitor({ id: "monitor-1" });
			await getMonitorNotifications({ id: "monitor-1" });
			await getMonitorTypes();
			await getEnabledMonitors();
			await getMonitors({ type: "http" });
			await getMonitorBootTime({ id: "monitor-1" });

			expect(mocks.findUnique).toHaveBeenCalled();
			expect(mocks.findFirst).toHaveBeenCalled();
			expect(mocks.groupBy).toHaveBeenCalledWith({
				by: ["type"],
				_count: { type: true },
			});
			expect(mocks.findMany).toHaveBeenCalledWith({
				where: { enabled: true },
				select: { id: true },
			});
		});

		it("loads database and file metadata", async () => {
			await getDatabaseMeta({ id: "db-1" });
			await getDatabaseFile({ id: "file-1" });
			await getFileNotifications({ id: "file-1" });
			await getMonitorDatabases({ monitorId: "monitor-1" });
			await getMonitorDrives({ monitorId: "monitor-1" });
			await getMonitorDisabledDatabases({ monitorId: "monitor-1" });
			await getMonitorDisabledDrives({ monitorId: "monitor-1" });

			expect(mocks.findUnique).toHaveBeenCalled();
			expect(mocks.findMany).toHaveBeenCalled();
		});

		it("loads usage and feed history", async () => {
			await getFileUsageLatest({ databaseFileId: "file-1" });
			await getFileUsage({ id: "file-1", startDate, endDate });
			await getDatabaseUsage({ id: "db-1", startDate, endDate });
			await getCpuUsage({ id: "monitor-1", startDate, endDate });
			await getPing({ id: "monitor-1", startDate, endDate });
			await getDatabaseMemoryUsage({ id: "db-1", startDate, endDate });
			await getMemoryUsage({ id: "monitor-1", startDate, endDate });
			await getDatabaseLatestFeeds({ id: "db-1" });
			await getMonitorLatestFeeds({ id: "monitor-1" });
			await getMonitorLatestFeed({ id: "monitor-1" });

			expect(mocks.findFirst).toHaveBeenCalled();
			expect(mocks.findMany).toHaveBeenCalled();
		});
	});

	describe("logs", () => {
		it("creates monitor logs", async () => {
			await monitorLog({
				monitorId: "monitor-1",
				type: "error",
				message: "offline",
				driveId: null,
				databaseId: null,
				fileId: null,
			});

			expect(mocks.create).toHaveBeenCalledWith({
				data: {
					monitorId: "monitor-1",
					type: "error",
					message: "offline",
					driveId: null,
					databaseId: null,
					fileId: null,
				},
			});
		});

		it("marks monitor errors and paginates logs", async () => {
			mocks.findMany.mockResolvedValue([{ id: "log-1" }]);

			await monitorError({ id: "monitor-1" });
			await getLatestMonitorLog({ monitorId: "monitor-1" });
			const result = await getMonitorLogs({
				monitorId: "monitor-1",
				page: 1,
				size: 10,
			});

			expect(mocks.update).toHaveBeenCalledWith({
				where: { id: "monitor-1" },
				data: { hasError: true },
			});
			expect(mocks.transaction).toHaveBeenCalled();
			expect(result).toEqual({
				pages: 2,
				logs: [{ id: "log-1" }],
			});
		});
	});

	describe("edits", () => {
		it("updates databases and files", async () => {
			await editDatabase({
				id: "db-1",
				title: "Atlas",
				description: "Primary",
				enabled: true,
			});
			await editFile({ id: "file-1", enabled: false });

			expect(mocks.update).toHaveBeenCalledWith({
				where: { id: "db-1" },
				data: {
					title: "Atlas",
					description: "Primary",
					enabled: true,
				},
				select: { id: true },
			});
			expect(mocks.update).toHaveBeenCalledWith({
				where: { id: "file-1" },
				data: { enabled: false },
				select: { id: true },
			});
		});
	});

	describe("notifications and telemetry updates", () => {
		it("updates monitor notification settings", async () => {
			await updateMonitorNotifications({
				id: "monitor-1",
				connectionNotify: true,
				connectionNotifyTypes: ["n1"],
				connectionNotifyResendAfterMinutes: 30,
				connectionNotifyRetries: 3,
				rebootNotify: true,
				rebootNotifyTypes: ["n2"],
				httpCertNotify: true,
				httpCertNotifyTypes: ["n3"],
				httpCertNotifyResendAfterMinutes: 60,
				sqlFileSizePercentFreeNotify: true,
				sqlFileSizePercentFreeNotifyTypes: ["n4"],
				sqlFileSizePercentFreeNotifyResendAfterMinutes: 120,
				sqlFileSizePercentFreeValue: 20,
			});

			expect(mocks.update).toHaveBeenCalledWith({
				where: { id: "monitor-1" },
				data: expect.objectContaining({
					connectionNotifyTypes: { set: [{ id: "n1" }] },
					rebootNotifyTypes: { set: [{ id: "n2" }] },
					httpCertNotifyTypes: { set: [{ id: "n3" }] },
					sqlFileSizePercentFreeNotifyTypes: { set: [{ id: "n4" }] },
				}),
			});
		});

		it("stores incoming monitor telemetry", async () => {
			const bootTime = new Date("2026-08-28T10:00:00.000Z");

			await updateMonitor({
				id: "monitor-1",
				data: {
					name: "SERVER01",
					lastBootTime: bootTime,
					certDays: "30",
					certValid: true,
				},
				feed: {
					memoryFree: "4096",
					memoryTotal: "8192",
					cpuLoad: "12",
					cpuSpeed: "2400",
					ping: "10",
				},
				drives: [
					{
						data: {
							name: "C",
							size: "1000",
						},
						used: "800",
						free: "200",
					},
				],
				databases: [
					{
						data: {
							databaseId: "db-1",
							name: "Atlas",
						},
						memory: "512",
						files: [
							{
								data: {
									sqlDatabaseId: "db-1",
									fileId: "1",
									fileName: "data.mdf",
								},
								usedSize: "900",
								currentSize: "1000",
								maxSize: "2000",
							},
						],
					},
				],
				cpus: [{ name: "CPU 0", used: "10", speed: "2400" }],
			});

			expect(mocks.update).toHaveBeenCalledWith({
				where: { id: "monitor-1" },
				data: expect.objectContaining({
					name: "SERVER01",
					lastBootTime: bootTime.toISOString(),
					hasError: false,
					feeds: expect.any(Object),
					drives: expect.any(Object),
					databases: expect.any(Object),
					cpus: expect.any(Object),
				}),
				select: expect.any(Object),
			});
		});

		it("updates notification timestamps and file metrics", async () => {
			const sentAt = new Date("2026-08-28T10:00:00.000Z");

			await setMonitorConnectionRetried({
				id: "monitor-1",
				connectionNotifyRetried: true,
			});
			await setMonitorConnectionSentAt({
				id: "monitor-1",
				connectionNotifySentAt: sentAt,
			});
			await setMonitorRebootSentAt({
				id: "monitor-1",
				rebootNotifySentAt: sentAt,
			});
			await setMonitorHttpCertSentAt({
				id: "monitor-1",
				httpCertNotifySentAt: sentAt,
			});
			await setFilePercFreeSentAt({
				id: "file-1",
				sqlFileSizePercentFreeNotifySentAt: sentAt,
			});
			await setFileDays({ id: "file-1", daysTillFull: 10 });
			await setFileGrowth({ id: "file-1", growthRate: 5 });
			await setFeedError({
				id: "feed-1",
				message: "timeout",
				hasError: true,
			});

			expect(mocks.update).toHaveBeenCalledTimes(8);
		});
	});
});
