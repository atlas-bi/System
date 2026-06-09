// @vitest-environment node

import http from "node:http";
import net from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("~/notifications/notifier", () => ({
	default: vi.fn(),
}));

vi.mock("~/models/monitor.server", () => ({
	monitorError: vi.fn(),
	updateMonitor: vi.fn(),
	setFeedError: vi.fn(),
}));

const serversToClose: Array<http.Server | net.Server> = [];

afterEach(async () => {
	await Promise.all(
		serversToClose.splice(0).map(
			(server) =>
				new Promise<void>((resolve, reject) => {
					server.close((error) => {
						if (error) reject(error);
						else resolve();
					});
				}),
		),
	);
});

function listen(server: http.Server | net.Server) {
	serversToClose.push(server);
	return new Promise<number>((resolve, reject) => {
		server.listen(0, "127.0.0.1", () => {
			const address = server.address();
			if (!address || typeof address === "string") {
				reject(new Error("Failed to resolve test server port."));
				return;
			}
			resolve(address.port);
		});
		server.once("error", reject);
	});
}

describe("monitor transport integrations", () => {
	it("checks a live HTTP endpoint", async () => {
		const server = http.createServer((_req, res) => {
			res.writeHead(204);
			res.end();
		});
		const port = await listen(server);
		const { HttpCheck } = await import("./http.server");

		const { res } = await HttpCheck({
			httpUrl: `http://127.0.0.1:${port}/health`,
			httpAcceptedStatusCodes: ["200s"],
		});

		expect(res.status).toBe(204);
	});

	it("checks an open TCP port", async () => {
		const server = net.createServer((socket) => socket.end());
		const port = await listen(server);
		const { TcpCheck } = await import("./tcp.server");

		const result = await TcpCheck({
			address: "127.0.0.1",
			port,
		});

		expect(result.avg).toBeGreaterThanOrEqual(0);
	});
});
