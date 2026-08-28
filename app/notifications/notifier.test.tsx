// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	getMonitor,
	collectionNotifier,
	httpCertNotifier,
	sqlFilePercentFreeNotifier,
	rebootNotifier,
	getDriveLatestFeed,
	percentFreeNotifier,
	getNotificationConnection,
	smtp,
	telegram,
} = vi.hoisted(() => ({
	getMonitor: vi.fn(),
	collectionNotifier: vi.fn(),
	httpCertNotifier: vi.fn(),
	sqlFilePercentFreeNotifier: vi.fn(),
	rebootNotifier: vi.fn(),
	getDriveLatestFeed: vi.fn(),
	percentFreeNotifier: vi.fn(),
	getNotificationConnection: vi.fn(),
	smtp: vi.fn(),
	telegram: vi.fn(),
}));

vi.mock("~/models/monitor.server", () => ({ getMonitor }));
vi.mock("~/models/drive.server", () => ({ getDriveLatestFeed }));
vi.mock("~/models/notification.server", () => ({
	getNotificationConnection,
}));
vi.mock("./smtp", () => ({ default: smtp }));
vi.mock("./telegram", () => ({ default: telegram }));
vi.mock("./checks/monitors/collection", () => ({
	default: collectionNotifier,
}));
vi.mock("./checks/monitors/httpCert", () => ({ default: httpCertNotifier }));
vi.mock("./checks/monitors/sqlFiles", () => ({
	default: sqlFilePercentFreeNotifier,
}));
vi.mock("./checks/monitors/reboot", () => ({ default: rebootNotifier }));
vi.mock("./checks/drives/percentFree", () => ({
	default: percentFreeNotifier,
}));

import Notifier, { sendNotification } from "./notifier";

const baseMonitor = {
	id: "monitor-1",
	type: "http",
} as never;

describe("Notifier", () => {
	beforeEach(() => {
		getMonitor.mockReset();
		collectionNotifier.mockReset();
		httpCertNotifier.mockReset();
		sqlFilePercentFreeNotifier.mockReset();
		rebootNotifier.mockReset();
		getDriveLatestFeed.mockReset();
		percentFreeNotifier.mockReset();
	});

	it("returns early when the monitor does not exist", async () => {
		getMonitor.mockResolvedValue(null);

		await Notifier({ job: "missing-monitor" });

		expect(collectionNotifier).not.toHaveBeenCalled();
	});

	it("runs shared monitor notifiers for every monitor type", async () => {
		getMonitor.mockResolvedValue(baseMonitor);

		await Notifier({ job: "monitor-1", message: "offline" });

		expect(collectionNotifier).toHaveBeenCalledWith({
			monitor: baseMonitor,
			message: "offline",
		});
		expect(httpCertNotifier).toHaveBeenCalledWith({ monitor: baseMonitor });
		expect(sqlFilePercentFreeNotifier).toHaveBeenCalledWith({
			monitor: baseMonitor,
		});
		expect(rebootNotifier).not.toHaveBeenCalled();
	});

	it("runs reboot and drive checks for host monitors", async () => {
		const monitor = {
			id: "ubuntu-monitor",
			type: "ubuntu",
			drives: [{ id: "drive-1", enabled: true, missingNotify: false }],
		};
		const oldMonitor = { id: "ubuntu-monitor", type: "ubuntu" };
		const usage = { free: 100, size: 1000 };

		getMonitor.mockResolvedValue(monitor);
		getDriveLatestFeed.mockResolvedValue(usage);

		await Notifier({
			job: "ubuntu-monitor",
			oldMonitor: oldMonitor as never,
		});

		expect(rebootNotifier).toHaveBeenCalledWith({
			monitor,
			oldMonitor,
		});
		expect(getDriveLatestFeed).toHaveBeenCalledWith({ id: "drive-1" });
		expect(percentFreeNotifier).toHaveBeenCalledWith({
			drive: monitor.drives[0],
			monitor,
			usage,
		});
	});
});

describe("sendNotification", () => {
	beforeEach(() => {
		getNotificationConnection.mockReset();
		smtp.mockReset();
		telegram.mockReset();
	});

	it("returns early when the notification no longer exists", async () => {
		getNotificationConnection.mockResolvedValue(null);

		await sendNotification({
			notification: { id: "n1", type: "smtp", name: "email" },
			subject: "Alert",
			message: "offline",
		});

		expect(smtp).not.toHaveBeenCalled();
		expect(telegram).not.toHaveBeenCalled();
	});

	it("delegates to SMTP and Telegram", async () => {
		const smtpNotification = { id: "n1", type: "smtp", name: "email" };
		const telegramNotification = {
			id: "n2",
			type: "telegram",
			name: "telegram",
		};
		getNotificationConnection
			.mockResolvedValueOnce(smtpNotification)
			.mockResolvedValueOnce(telegramNotification);

		await sendNotification({
			notification: smtpNotification,
			subject: "Alert",
			message: "offline",
		});
		await sendNotification({
			notification: telegramNotification,
			subject: "Alert",
			message: "offline",
		});

		expect(smtp).toHaveBeenCalledWith({
			notification: smtpNotification,
			subject: "Alert",
			message: "offline",
		});
		expect(telegram).toHaveBeenCalledWith({
			notification: telegramNotification,
			message: "Alert",
		});
	});
});
