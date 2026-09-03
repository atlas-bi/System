// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	logger,
	getFileUsageLatest,
	setFilePercFreeSentAt,
	render,
	sendNotification,
} = vi.hoisted(() => ({
	logger: vi.fn(),
	getFileUsageLatest: vi.fn(),
	setFilePercFreeSentAt: vi.fn(),
	render: vi.fn().mockResolvedValue("html"),
	sendNotification: vi.fn(),
}));

vi.mock("~/models/monitor.server", () => ({
	getFileUsageLatest,
	setFilePercFreeSentAt,
}));
vi.mock("~/notifications/logger", () => ({ Logger: logger }));
vi.mock("~/notifications/notifier", () => ({ sendNotification }));
vi.mock("@react-email/render", () => ({ render }));

import sqlFilePercentFreeNotifier from "./sqlFiles";

const baseMonitor = {
	id: "sql-monitor",
	type: "sqlServer",
	name: "SQL-01",
	sqlFileSizePercentFreeNotify: true,
	sqlFileSizePercentFreeValue: 20,
	sqlFileSizePercentFreeNotifyResendAfterMinutes: null,
	sqlFileSizePercentFreeNotifyTypes: [
		{ id: "n1", type: "smtp", name: "email" },
	],
	databases: [
		{
			id: "db-1",
			name: "Atlas",
			enabled: true,
			files: [
				{
					id: "file-1",
					fileName: "data.mdf",
					enabled: true,
					growth: 0,
					sqlFileSizePercentFreeNotifySentAt: null,
				},
			],
		},
	],
} as never;

async function flushAsyncWork() {
	await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("sqlFilePercentFreeNotifier", () => {
	beforeEach(() => {
		logger.mockClear();
		getFileUsageLatest.mockClear();
		setFilePercFreeSentAt.mockClear();
		render.mockClear();
		sendNotification.mockClear();
	});

	it("ignores non-sql monitors", async () => {
		await sqlFilePercentFreeNotifier({
			monitor: { ...baseMonitor, type: "http" },
		});

		expect(getFileUsageLatest).not.toHaveBeenCalled();
	});

	it("resets files when alerts are disabled", async () => {
		await sqlFilePercentFreeNotifier({
			monitor: { ...baseMonitor, sqlFileSizePercentFreeNotify: false },
		});
		await flushAsyncWork();

		expect(setFilePercFreeSentAt).toHaveBeenCalledWith({
			id: "file-1",
			sqlFileSizePercentFreeNotifySentAt: null,
		});
	});

	it("alerts when fixed-size file free space is below the limit", async () => {
		getFileUsageLatest.mockResolvedValue({
			usedSize: 900,
			currentSize: 1000,
			maxSize: 0,
		});

		await sqlFilePercentFreeNotifier({ monitor: baseMonitor });
		await flushAsyncWork();

		expect(logger).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "error",
				message: expect.stringContaining("Growth disabled"),
			}),
		);
		expect(setFilePercFreeSentAt).toHaveBeenCalledWith({
			id: "file-1",
			sqlFileSizePercentFreeNotifySentAt: expect.any(Date),
		});
	});

	it("clears prior alerts when free space rises above the limit", async () => {
		getFileUsageLatest.mockResolvedValue({
			usedSize: 100,
			currentSize: 1000,
			maxSize: 0,
		});

		await sqlFilePercentFreeNotifier({
			monitor: {
				...baseMonitor,
				databases: [
					{
						...baseMonitor.databases[0],
						files: [
							{
								...baseMonitor.databases[0].files[0],
								sqlFileSizePercentFreeNotifySentAt: new Date(
									"2026-01-01T00:00:00.000Z",
								),
							},
						],
					},
				],
			},
		});
		await flushAsyncWork();

		expect(sendNotification).toHaveBeenCalled();
		expect(setFilePercFreeSentAt).toHaveBeenCalledWith({
			id: "file-1",
			sqlFileSizePercentFreeNotifySentAt: null,
		});
	});
});
