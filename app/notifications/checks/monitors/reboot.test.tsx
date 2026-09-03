// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { logger, setMonitorRebootSentAt, render, sendNotification } = vi.hoisted(
	() => ({
		logger: vi.fn(),
		setMonitorRebootSentAt: vi.fn(),
		render: vi.fn().mockResolvedValue("html"),
		sendNotification: vi.fn(),
	}),
);

vi.mock("~/models/monitor.server", () => ({ setMonitorRebootSentAt }));
vi.mock("~/notifications/logger", () => ({ Logger: logger }));
vi.mock("~/notifications/notifier", () => ({ sendNotification }));
vi.mock("@react-email/render", () => ({ render }));

import rebootNotifier from "./reboot";

const baseMonitor = {
	id: "ubuntu-monitor",
	host: "server.example.com",
	rebootNotify: true,
	lastBootTime: new Date("2026-08-28T10:00:00.000Z"),
	rebootNotifyTypes: [{ id: "n1", type: "smtp", name: "email" }],
} as never;

describe("rebootNotifier", () => {
	beforeEach(() => {
		logger.mockClear();
		setMonitorRebootSentAt.mockClear();
		render.mockClear();
		sendNotification.mockClear();
	});

	it("does nothing when reboot notifications are disabled", async () => {
		await rebootNotifier({
			monitor: { ...baseMonitor, rebootNotify: false },
			oldMonitor: {
				...baseMonitor,
				lastBootTime: new Date("2026-08-27T10:00:00.000Z"),
			},
		});

		expect(logger).not.toHaveBeenCalled();
		expect(setMonitorRebootSentAt).not.toHaveBeenCalled();
	});

	it("does nothing when boot time has not changed", async () => {
		await rebootNotifier({
			monitor: baseMonitor,
			oldMonitor: baseMonitor,
		});

		expect(logger).not.toHaveBeenCalled();
		expect(setMonitorRebootSentAt).not.toHaveBeenCalled();
	});

	it("notifies when boot time changes", async () => {
		const oldBootTime = new Date("2026-08-27T10:00:00.000Z");
		const newBootTime = new Date("2026-08-28T10:00:00.000Z");

		await rebootNotifier({
			monitor: { ...baseMonitor, lastBootTime: newBootTime },
			oldMonitor: { ...baseMonitor, lastBootTime: oldBootTime },
		});

		expect(sendNotification).toHaveBeenCalled();
		expect(logger).toHaveBeenCalledWith({
			message: expect.stringContaining("Reboot time changed"),
			type: "warning",
			monitor: expect.objectContaining({ id: "ubuntu-monitor" }),
		});
		expect(setMonitorRebootSentAt).toHaveBeenCalledWith({
			id: "ubuntu-monitor",
			rebootNotifySentAt: expect.any(Date),
		});
	});
});
