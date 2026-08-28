// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { logger, setMonitorHttpCertSentAt, render, sendNotification } =
	vi.hoisted(() => ({
		logger: vi.fn(),
		setMonitorHttpCertSentAt: vi.fn(),
		render: vi.fn().mockResolvedValue("html"),
		sendNotification: vi.fn(),
	}));

vi.mock("~/models/monitor.server", () => ({ setMonitorHttpCertSentAt }));
vi.mock("~/notifications/logger", () => ({ Logger: logger }));
vi.mock("~/notifications/notifier", () => ({ sendNotification }));
vi.mock("@react-email/render", () => ({ render }));

import httpCertNotifier from "./httpCert";

const baseMonitor = {
	id: "http-monitor",
	type: "http",
	title: "Example",
	name: null,
	httpUrl: "https://example.com",
	httpCheckCert: true,
	httpCertNotify: true,
	httpCertNotifyTypes: [{ id: "n1", type: "smtp", name: "email" }],
	httpCertNotifySentAt: null,
	httpCertNotifyResendAfterMinutes: null,
} as never;

describe("httpCertNotifier", () => {
	beforeEach(() => {
		logger.mockClear();
		setMonitorHttpCertSentAt.mockClear();
		render.mockClear();
		sendNotification.mockClear();
	});

	it("includes days in the certificate expiry error log", async () => {
		await httpCertNotifier({
			monitor: {
				...baseMonitor,
				certValid: true,
				certDays: "10",
			},
		});

		expect(logger).toHaveBeenCalledWith({
			message: "Certificate expires in 10 days.",
			type: "error",
			monitor: expect.objectContaining({ id: "http-monitor" }),
		});
		expect(setMonitorHttpCertSentAt).toHaveBeenCalledWith({
			id: "http-monitor",
			httpCertNotifySentAt: expect.any(Date),
		});
	});

	it("notifies when the certificate is invalid", async () => {
		await httpCertNotifier({
			monitor: {
				...baseMonitor,
				certValid: false,
				certDays: "30",
			},
		});

		expect(logger).toHaveBeenCalledWith({
			message: "Certificate is invalid.",
			type: "error",
			monitor: expect.objectContaining({ id: "http-monitor" }),
		});
	});

	it("notifies when certificate details could not be determined", async () => {
		await httpCertNotifier({
			monitor: {
				...baseMonitor,
				certValid: true,
				certDays: null,
			},
		});

		expect(logger).toHaveBeenCalledWith({
			message: "Certificate could not be determined.",
			type: "error",
			monitor: expect.objectContaining({ id: "http-monitor" }),
		});
	});

	it("clears prior alerts when the certificate becomes valid again", async () => {
		await httpCertNotifier({
			monitor: {
				...baseMonitor,
				certValid: true,
				certDays: "90",
				httpCertNotifySentAt: new Date("2026-01-01T00:00:00.000Z"),
			},
		});

		expect(sendNotification).toHaveBeenCalled();
		expect(setMonitorHttpCertSentAt).toHaveBeenCalledWith({
			id: "http-monitor",
			httpCertNotifySentAt: null,
		});
	});

	it("does not notify when cert checking is disabled", async () => {
		await httpCertNotifier({
			monitor: {
				...baseMonitor,
				httpCheckCert: false,
				certValid: false,
				certDays: "5",
				httpCertNotifySentAt: new Date(),
			},
		});

		expect(logger).not.toHaveBeenCalled();
		expect(setMonitorHttpCertSentAt).toHaveBeenCalledWith({
			id: "http-monitor",
			httpCertNotifySentAt: null,
		});
	});

	it("skips resending until the configured interval has elapsed", async () => {
		await httpCertNotifier({
			monitor: {
				...baseMonitor,
				certValid: false,
				certDays: "5",
				httpCertNotifySentAt: new Date(),
				httpCertNotifyResendAfterMinutes: 120,
			},
		});

		expect(logger).not.toHaveBeenCalled();
		expect(setMonitorHttpCertSentAt).not.toHaveBeenCalled();
	});

	it("logs notification delivery failures", async () => {
		sendNotification.mockRejectedValue(new Error("smtp down"));

		await httpCertNotifier({
			monitor: {
				...baseMonitor,
				certValid: false,
				certDays: "5",
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

	it("logs all-clear notification delivery failures", async () => {
		sendNotification.mockRejectedValue(new Error("smtp down"));

		await httpCertNotifier({
			monitor: {
				...baseMonitor,
				certValid: true,
				certDays: "90",
				httpCertNotifySentAt: new Date("2026-01-01T00:00:00.000Z"),
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

	it("resends alerts after the configured interval has elapsed", async () => {
		await httpCertNotifier({
			monitor: {
				...baseMonitor,
				certValid: false,
				certDays: "5",
				httpCertNotifySentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
				httpCertNotifyResendAfterMinutes: 30,
			},
		});

		expect(logger).toHaveBeenCalledWith({
			message: "Certificate is invalid.",
			type: "error",
			monitor: expect.objectContaining({ id: "http-monitor" }),
		});
	});
});
