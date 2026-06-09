// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

const pingMock = vi.fn();

vi.mock("tcp-ping", () => ({
	default: {
		ping: pingMock,
	},
}));

vi.mock("~/notifications/notifier", () => ({
	default: vi.fn(),
}));

vi.mock("~/models/monitor.server", () => ({
	monitorError: vi.fn(),
	updateMonitor: vi.fn(),
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
