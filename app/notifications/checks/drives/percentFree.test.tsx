// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { logger, setDrivePercFreeSentAt, render, sendNotification } = vi.hoisted(
	() => ({
		logger: vi.fn(),
		setDrivePercFreeSentAt: vi.fn(),
		render: vi.fn().mockResolvedValue("html"),
		sendNotification: vi.fn(),
	}),
);

vi.mock("~/models/drive.server", () => ({ setDrivePercFreeSentAt }));
vi.mock("~/notifications/logger", () => ({ Logger: logger }));
vi.mock("~/notifications/notifier", () => ({ sendNotification }));
vi.mock("@react-email/render", () => ({ render }));

import percentFreeNotifier from "./percentFree";

const baseDrive = {
	id: "drive-1",
	name: "C",
	size: 1000,
	percFreeNotify: true,
	percFreeValue: 20,
	percFreeNotifySentAt: null,
	percFreeNotifyResendAfterMinutes: null,
	percFreeNotifyTypes: [{ id: "n1", type: "smtp", name: "email" }],
} as never;

const baseMonitor = {
	id: "monitor-1",
	host: "server.example.com",
} as never;

describe("percentFreeNotifier", () => {
	beforeEach(() => {
		logger.mockClear();
		setDrivePercFreeSentAt.mockClear();
		render.mockClear();
		sendNotification.mockClear();
	});

	it("resets notification state when alerts are disabled", async () => {
		await percentFreeNotifier({
			drive: { ...baseDrive, percFreeNotify: false },
			monitor: baseMonitor,
			usage: { free: 100 },
		});

		expect(setDrivePercFreeSentAt).toHaveBeenCalledWith({
			id: "drive-1",
			percFreeNotifySentAt: null,
		});
		expect(logger).not.toHaveBeenCalled();
	});

	it("logs an error when free space is below the limit", async () => {
		await percentFreeNotifier({
			drive: baseDrive,
			monitor: baseMonitor,
			usage: { free: 100 },
		});

		expect(logger).toHaveBeenCalledWith({
			message: "Percentage of free space (10%) is less than limit of 20%",
			type: "error",
			monitor: baseMonitor,
			drive: expect.objectContaining({ id: "drive-1" }),
		});
		expect(setDrivePercFreeSentAt).toHaveBeenCalledWith({
			id: "drive-1",
			percFreeNotifySentAt: expect.any(Date),
		});
	});

	it("clears prior alerts when free space rises above the limit", async () => {
		await percentFreeNotifier({
			drive: {
				...baseDrive,
				percFreeNotifySentAt: new Date("2026-01-01T00:00:00.000Z"),
			},
			monitor: baseMonitor,
			usage: { free: 500 },
		});

		expect(sendNotification).toHaveBeenCalled();
		expect(logger).toHaveBeenCalledWith({
			message: "Free space now below limit of 20%",
			type: "success",
			monitor: baseMonitor,
			drive: expect.objectContaining({ id: "drive-1" }),
		});
		expect(setDrivePercFreeSentAt).toHaveBeenCalledWith({
			id: "drive-1",
			percFreeNotifySentAt: null,
		});
	});

	it("skips resending until the configured interval has elapsed", async () => {
		await percentFreeNotifier({
			drive: {
				...baseDrive,
				percFreeNotifySentAt: new Date(),
				percFreeNotifyResendAfterMinutes: 120,
			},
			monitor: baseMonitor,
			usage: { free: 100 },
		});

		expect(logger).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "error",
			}),
		);
		expect(sendNotification).not.toHaveBeenCalled();
		expect(setDrivePercFreeSentAt).not.toHaveBeenCalled();
	});
});
