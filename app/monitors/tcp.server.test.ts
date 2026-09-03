// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const pingMock = vi.fn();
const { monitorErrorMock, updateMonitorMock, notifierMock } = vi.hoisted(
	() => ({
		monitorErrorMock: vi.fn(),
		updateMonitorMock: vi.fn(),
		notifierMock: vi.fn(),
	}),
);

vi.mock("tcp-ping", () => ({
	default: {
		ping: pingMock,
	},
}));

vi.mock("~/notifications/notifier", () => ({
	default: notifierMock,
}));

vi.mock("~/models/monitor.server", () => ({
	monitorError: monitorErrorMock,
	updateMonitor: updateMonitorMock,
}));

describe("TcpCheck", () => {
	it("delegates to tcp-ping with a single attempt", async () => {
		pingMock.mockImplementation(
			(
				_options: { address: string; port: number; attempts: number },
				callback: (error: null, data: { avg: number }) => void,
			) => callback(null, { avg: 12 }),
		);

		const { TcpCheck } = await import("./tcp.server");

		await expect(
			TcpCheck({
				address: "127.0.0.1",
				port: 8080,
			}),
		).resolves.toEqual({ avg: 12 });

		expect(pingMock).toHaveBeenCalledWith(
			{ address: "127.0.0.1", port: 8080, attempts: 1 },
			expect.any(Function),
		);
	});
});

describe("TcpMonitor", () => {
	beforeEach(() => {
		pingMock.mockReset();
		monitorErrorMock.mockReset();
		updateMonitorMock.mockReset();
		notifierMock.mockReset();
		updateMonitorMock.mockResolvedValue({});
		notifierMock.mockResolvedValue(undefined);
	});

	it("records latency and notifies on success", async () => {
		pingMock.mockImplementation(
			(
				_options: { address: string; port: number; attempts: number },
				callback: (error: null, data: { avg: number }) => void,
			) => callback(null, { avg: 9 }),
		);
		const TcpMonitor = (await import("./tcp.server")).default;

		await TcpMonitor({
			monitor: {
				id: "tcp-1",
				type: "tcp",
				host: "127.0.0.1",
				port: "8080",
			} as never,
		});

		expect(updateMonitorMock).toHaveBeenCalledWith({
			id: "tcp-1",
			feed: { ping: expect.any(String) },
		});
		expect(notifierMock).toHaveBeenCalledWith({ job: "tcp-1" });
		expect(monitorErrorMock).not.toHaveBeenCalled();
	});

	it("marks the monitor as failed when the port is unreachable", async () => {
		pingMock.mockImplementation(
			(
				_options: { address: string; port: number; attempts: number },
				callback: (error: Error, data: undefined) => void,
			) => callback(new Error("timeout"), undefined),
		);
		const TcpMonitor = (await import("./tcp.server")).default;

		await TcpMonitor({
			monitor: {
				id: "tcp-1",
				type: "tcp",
				host: "127.0.0.1",
				port: "8080",
			} as never,
		});

		expect(monitorErrorMock).toHaveBeenCalledWith({ id: "tcp-1" });
		expect(notifierMock).toHaveBeenCalledWith({
			job: "tcp-1",
			message: expect.stringContaining("timeout"),
		});
	});

	it("throws when host or port is missing", async () => {
		const TcpMonitor = (await import("./tcp.server")).default;

		await expect(
			TcpMonitor({
				monitor: {
					id: "tcp-1",
					type: "tcp",
					host: null,
					port: null,
				} as never,
			}),
		).rejects.toThrow("Host and port are required");
	});

	it("falls back to toString when an error serializes to an empty object", async () => {
		pingMock.mockImplementation(
			(
				_options: { address: string; port: number; attempts: number },
				callback: (error: object, data: undefined) => void,
			) => callback({}, undefined),
		);
		const TcpMonitor = (await import("./tcp.server")).default;

		await TcpMonitor({
			monitor: {
				id: "tcp-1",
				type: "tcp",
				host: "127.0.0.1",
				port: "8080",
			} as never,
		});

		expect(notifierMock).toHaveBeenCalledWith({
			job: "tcp-1",
			message: "[object Object]",
		});
	});

	it("handles errors that cannot be JSON serialized", async () => {
		const circular: { self?: unknown } = new Error("loop");
		circular.self = circular;
		pingMock.mockImplementation(
			(
				_options: { address: string; port: number; attempts: number },
				callback: (error: object, data: undefined) => void,
			) => callback(circular, undefined),
		);
		const TcpMonitor = (await import("./tcp.server")).default;

		await TcpMonitor({
			monitor: {
				id: "tcp-1",
				type: "tcp",
				host: "127.0.0.1",
				port: "8080",
			} as never,
		});

		expect(monitorErrorMock).toHaveBeenCalledWith({ id: "tcp-1" });
	});
});
