// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { logger, setMonitorHttpCertSentAt, render } = vi.hoisted(() => ({
	logger: vi.fn(),
	setMonitorHttpCertSentAt: vi.fn(),
	render: vi.fn().mockResolvedValue("html"),
}));

vi.mock("~/models/monitor.server", () => ({ setMonitorHttpCertSentAt }));
vi.mock("~/notifications/logger", () => ({ Logger: logger }));
vi.mock("~/notifications/notifier", () => ({ sendNotification: vi.fn() }));
vi.mock("@react-email/render", () => ({ render }));

import httpCertNotifier from "./httpCert";

describe("httpCertNotifier", () => {
	beforeEach(() => {
		logger.mockClear();
		setMonitorHttpCertSentAt.mockClear();
		render.mockClear();
	});

	it("includes days in the certificate expiry error log", async () => {
		await httpCertNotifier({
			monitor: {
				id: "http-monitor",
				type: "http",
				title: "Example",
				name: null,
				httpUrl: "https://example.com",
				httpCheckCert: true,
				httpCertNotify: true,
				certValid: true,
				certDays: "10",
				httpCertNotifyTypes: [],
				httpCertNotifySentAt: null,
				httpCertNotifyResendAfterMinutes: null,
			} as never,
		});

		expect(logger).toHaveBeenCalledWith({
			message: "Certificate expires in 10 days.",
			type: "error",
			monitor: expect.objectContaining({ id: "http-monitor" }),
		});
	});

	it("does not notify when cert checking is disabled", async () => {
		await httpCertNotifier({
			monitor: {
				id: "http-monitor",
				type: "http",
				title: "Example",
				name: null,
				httpUrl: "https://example.com",
				httpCheckCert: false,
				httpCertNotify: true,
				certValid: false,
				certDays: "5",
				httpCertNotifyTypes: [{ id: "n1", type: "smtp", name: "email" }],
				httpCertNotifySentAt: new Date(),
				httpCertNotifyResendAfterMinutes: null,
			} as never,
		});

		expect(logger).not.toHaveBeenCalled();
		expect(setMonitorHttpCertSentAt).toHaveBeenCalledWith({
			id: "http-monitor",
			httpCertNotifySentAt: null,
		});
	});
});
