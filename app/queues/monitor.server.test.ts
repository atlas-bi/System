// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const queueMock = vi.fn(
	(_name: string, handler: (job: string) => Promise<void>) => {
		return handler;
	},
);
const getMonitorMock = vi.fn();
const windowsMonitorMock = vi.fn();
const ubuntuMonitorMock = vi.fn();
const httpMonitorMock = vi.fn();
const sqlServerMonitorMock = vi.fn();
const tcpMonitorMock = vi.fn();

vi.mock("quirrel/remix", () => ({
	Queue: queueMock,
}));

vi.mock("~/models/monitor.server", () => ({
	getMonitor: getMonitorMock,
}));

vi.mock("~/monitors/windows.server", () => ({
	default: windowsMonitorMock,
}));

vi.mock("~/monitors/ubuntu.server", () => ({
	default: ubuntuMonitorMock,
}));

vi.mock("~/monitors/http.server", () => ({
	default: httpMonitorMock,
}));

vi.mock("~/monitors/sqlServer.server", () => ({
	default: sqlServerMonitorMock,
}));

vi.mock("~/monitors/tcp.server", () => ({
	default: tcpMonitorMock,
}));

describe("monitor queue", () => {
	beforeEach(() => {
		queueMock.mockClear();
		getMonitorMock.mockReset();
		windowsMonitorMock.mockReset();
		ubuntuMonitorMock.mockReset();
		httpMonitorMock.mockReset();
		sqlServerMonitorMock.mockReset();
		tcpMonitorMock.mockReset();
	});

	it("dispatches http monitors to the HTTP runner", async () => {
		getMonitorMock.mockResolvedValue({ id: "1", type: "http" });
		const queueHandler = (await import("./monitor.server")).default;

		await queueHandler("1");

		expect(queueMock).toHaveBeenCalledWith(
			"queues/monitor",
			expect.any(Function),
		);
		expect(httpMonitorMock).toHaveBeenCalledWith({
			monitor: { id: "1", type: "http" },
		});
		expect(sqlServerMonitorMock).not.toHaveBeenCalled();
		expect(tcpMonitorMock).not.toHaveBeenCalled();
	});

	it("dispatches sqlServer monitors to the SQL runner", async () => {
		getMonitorMock.mockResolvedValue({ id: "2", type: "sqlServer" });
		const queueHandler = (await import("./monitor.server")).default;

		await queueHandler("2");

		expect(sqlServerMonitorMock).toHaveBeenCalledWith({
			monitor: { id: "2", type: "sqlServer" },
		});
		expect(httpMonitorMock).not.toHaveBeenCalled();
		expect(tcpMonitorMock).not.toHaveBeenCalled();
	});

	it("returns without dispatch when the monitor is missing", async () => {
		getMonitorMock.mockResolvedValue(null);
		const queueHandler = (await import("./monitor.server")).default;

		await expect(queueHandler("missing")).resolves.toBeUndefined();

		expect(windowsMonitorMock).not.toHaveBeenCalled();
		expect(ubuntuMonitorMock).not.toHaveBeenCalled();
		expect(httpMonitorMock).not.toHaveBeenCalled();
		expect(sqlServerMonitorMock).not.toHaveBeenCalled();
		expect(tcpMonitorMock).not.toHaveBeenCalled();
	});
});
