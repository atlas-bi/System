// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	logger,
	render,
	sendNotification,
	setMonitorConnectionRetried,
	setMonitorConnectionSentAt,
} = vi.hoisted(() => ({
	logger: vi.fn(),
	render: vi.fn().mockResolvedValue("html"),
	sendNotification: vi.fn(),
	setMonitorConnectionRetried: vi.fn(),
	setMonitorConnectionSentAt: vi.fn(),
}));

vi.mock("~/models/monitor.server", () => ({
	setMonitorConnectionRetried,
	setMonitorConnectionSentAt,
}));
vi.mock("~/notifications/logger", () => ({ Logger: logger }));
vi.mock("~/notifications/notifier", () => ({ sendNotification }));
vi.mock("@react-email/render", () => ({ render }));

import collectionNotifier from "./collection";

const baseMonitor = {
	id: "monitor-1",
	type: "http",
	title: "Example",
	name: null,
	host: null,
	httpUrl: "https://example.com",
	connectionNotify: true,
	connectionNotifySentAt: null,
	connectionNotifyRetried: 0,
	connectionNotifyRetries: 2,
	connectionNotifyResendAfterMinutes: null,
	connectionNotifyTypes: [{ id: "n1", type: "smtp", name: "email" }],
} as never;

describe("collectionNotifier", () => {
	beforeEach(() => {
		logger.mockClear();
		render.mockClear();
		sendNotification.mockClear();
		setMonitorConnectionRetried.mockClear();
		setMonitorConnectionSentAt.mockClear();
	});

	it("does nothing when connection notifications are disabled", async () => {
		await collectionNotifier({
			monitor: { ...baseMonitor, connectionNotify: false },
		});

		expect(setMonitorConnectionSentAt).not.toHaveBeenCalled();
	});

	it("resets notification state when collection succeeds again", async () => {
		await collectionNotifier({
			monitor: { ...baseMonitor },
		});

		expect(setMonitorConnectionSentAt).toHaveBeenCalledWith({
			id: "monitor-1",
			connectionNotifySentAt: null,
		});
		expect(setMonitorConnectionRetried).toHaveBeenCalledWith({
			id: "monitor-1",
			connectionNotifyRetried: null,
		});
	});

	it("logs restored collection and sends a success notification", async () => {
		await collectionNotifier({
			monitor: {
				...baseMonitor,
				connectionNotifySentAt: new Date("2026-01-01T00:00:00.000Z"),
			},
		});

		expect(logger).toHaveBeenCalledWith({
			message: "Data collection restored.",
			type: "success",
			monitor: expect.objectContaining({ id: "monitor-1" }),
		});
		expect(sendNotification).toHaveBeenCalled();
	});

	it("logs failures and marks the notification as sent", async () => {
		await collectionNotifier({
			monitor: {
				...baseMonitor,
				connectionNotifyRetries: 0,
			},
			message: "Request failed with status code 400",
		});

		expect(logger).toHaveBeenCalledWith({
			message: "Request failed with status code 400",
			type: "error",
			monitor: expect.objectContaining({ id: "monitor-1" }),
		});
		expect(setMonitorConnectionSentAt).toHaveBeenCalledWith({
			id: "monitor-1",
			connectionNotifySentAt: expect.any(Date),
		});
	});

	it("increments the retry counter before the resend threshold is met", async () => {
		await collectionNotifier({
			monitor: {
				...baseMonitor,
				connectionNotifyRetries: 3,
				connectionNotifyRetried: 1,
			},
			message: "timeout",
		});

		expect(setMonitorConnectionRetried).toHaveBeenCalledWith({
			id: "monitor-1",
			connectionNotifyRetried: 2,
		});
		expect(setMonitorConnectionSentAt).not.toHaveBeenCalled();
	});

	it("resends failure notifications after the configured interval", async () => {
		await collectionNotifier({
			monitor: {
				...baseMonitor,
				connectionNotifyRetries: 0,
				connectionNotifySentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
				connectionNotifyResendAfterMinutes: 30,
			},
			message: "timeout",
		});

		expect(setMonitorConnectionSentAt).toHaveBeenCalledWith({
			id: "monitor-1",
			connectionNotifySentAt: expect.any(Date),
		});
	});

	it("logs notification delivery failures", async () => {
		sendNotification.mockRejectedValue(new Error("smtp down"));

		await collectionNotifier({
			monitor: {
				...baseMonitor,
				connectionNotifySentAt: new Date("2026-01-01T00:00:00.000Z"),
			},
		});
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(logger).toHaveBeenCalledWith(
			expect.objectContaining({
				message: expect.stringContaining("smtp down"),
				type: "error",
			}),
		);
	});

	it("formats monitor names for ssh and sql monitors", async () => {
		await collectionNotifier({
			monitor: {
				...baseMonitor,
				type: "ubuntu",
				title: "App Server",
				host: "10.0.0.5",
				connectionNotifyRetries: 0,
			},
			message: "connection refused",
		});

		expect(render).toHaveBeenCalled();
		expect(setMonitorConnectionSentAt).toHaveBeenCalled();

		await collectionNotifier({
			monitor: {
				...baseMonitor,
				type: "sqlServer",
				title: "Warehouse",
				name: "SQL01",
				connectionNotifyRetries: 0,
			},
			message: "login failed",
		});

		expect(setMonitorConnectionSentAt).toHaveBeenCalledTimes(2);
	});

	it("logs failure-notification delivery errors", async () => {
		sendNotification.mockRejectedValue(new Error("smtp down"));

		await collectionNotifier({
			monitor: {
				...baseMonitor,
				connectionNotifyRetries: 0,
			},
			message: "timeout",
		});
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(logger).toHaveBeenCalledWith(
			expect.objectContaining({
				message: expect.stringContaining("smtp down"),
				type: "error",
			}),
		);
	});

	it("stops retrying after the configured retry count is exceeded", async () => {
		await collectionNotifier({
			monitor: {
				...baseMonitor,
				connectionNotifyRetries: 2,
				connectionNotifyRetried: 3,
				connectionNotifySentAt: new Date(),
				connectionNotifyResendAfterMinutes: 120,
			},
			message: "timeout",
		});

		expect(setMonitorConnectionRetried).not.toHaveBeenCalled();
		expect(setMonitorConnectionSentAt).not.toHaveBeenCalled();
		expect(logger).toHaveBeenCalledWith({
			message: "timeout",
			type: "error",
			monitor: expect.objectContaining({ id: "monitor-1" }),
		});
	});
});
