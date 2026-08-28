// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	authenticateMock,
	createMonitorMock,
	editMonitorMock,
	deleteMonitorMock,
	httpCheckMock,
	tcpCheckMock,
} = vi.hoisted(() => ({
	authenticateMock: vi.fn(),
	createMonitorMock: vi.fn(),
	editMonitorMock: vi.fn(),
	deleteMonitorMock: vi.fn(),
	httpCheckMock: vi.fn(),
	tcpCheckMock: vi.fn(),
}));

vi.mock("~/services/auth.server", () => ({
	authenticate: authenticateMock,
}));

vi.mock("~/models/monitor.server", () => ({
	createMonitor: createMonitorMock,
	editMonitor: editMonitorMock,
	deleteMonitor: deleteMonitorMock,
}));

vi.mock("~/monitors/http.server", () => ({
	HttpCheck: httpCheckMock,
}));

vi.mock("~/monitors/tcp.server", () => ({
	TcpCheck: tcpCheckMock,
}));

vi.mock("node-ssh", () => ({
	NodeSSH: vi.fn(),
}));

vi.mock("mssql", () => ({
	default: { ConnectionPool: vi.fn() },
}));

import { action } from "./route";

const remixArgs = (request: Request) =>
	({ request, params: {}, context: {} }) as never;

describe("monitor/new action", () => {
	beforeEach(() => {
		authenticateMock.mockReset();
		createMonitorMock.mockReset();
		editMonitorMock.mockReset();
		deleteMonitorMock.mockReset();
		httpCheckMock.mockReset();
		tcpCheckMock.mockReset();
		authenticateMock.mockResolvedValue({ id: "user-1" });
	});

	it("requires a monitor name", async () => {
		const response = await action(
			remixArgs(
				new Request("http://localhost/monitor/new", {
					method: "POST",
					body: new URLSearchParams({
						_action: "new",
						type: "http",
						httpUrl: "https://example.com",
					}),
				}),
			),
		);

		await expect(response.json()).resolves.toEqual({
			form: { error: "Name is required." },
		});
	});

	it("requires an http url for http monitors", async () => {
		const response = await action(
			remixArgs(
				new Request("http://localhost/monitor/new", {
					method: "POST",
					body: new URLSearchParams({
						_action: "new",
						title: "Example",
						type: "http",
					}),
				}),
			),
		);

		await expect(response.json()).resolves.toEqual({
			form: { error: "URL is required." },
		});
	});

	it("requires tcp ports", async () => {
		const response = await action(
			remixArgs(
				new Request("http://localhost/monitor/new", {
					method: "POST",
					body: new URLSearchParams({
						_action: "new",
						title: "Example",
						type: "tcp",
						host: "127.0.0.1",
					}),
				}),
			),
		);

		await expect(response.json()).resolves.toEqual({
			form: { error: "Port is required." },
		});
	});

	it("creates a valid http monitor", async () => {
		createMonitorMock.mockResolvedValue({ id: "m1", type: "http" });

		const response = await action(
			remixArgs(
				new Request("http://localhost/monitor/new", {
					method: "POST",
					body: new URLSearchParams({
						_action: "new",
						title: "Example",
						type: "http",
						httpUrl: "https://example.com",
					}),
				}),
			),
		);

		await expect(response.json()).resolves.toEqual({
			monitor: { id: "m1", type: "http" },
		});
		expect(createMonitorMock).toHaveBeenCalled();
	});

	it("deletes a monitor and redirects home", async () => {
		const response = await action(
			remixArgs(
				new Request("http://localhost/monitor/new", {
					method: "POST",
					body: new URLSearchParams({
						_action: "delete",
						id: "monitor-1",
					}),
				}),
			),
		);

		expect(deleteMonitorMock).toHaveBeenCalledWith({ id: "monitor-1" });
		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe("/");
	});

	it("requires ssh credentials for server monitors", async () => {
		const response = await action(
			remixArgs(
				new Request("http://localhost/monitor/new", {
					method: "POST",
					body: new URLSearchParams({
						_action: "new",
						title: "Example",
						type: "ubuntu",
						host: "10.0.0.5",
					}),
				}),
			),
		);

		await expect(response.json()).resolves.toEqual({
			form: { error: "Username is required." },
		});
	});

	it("requires sql connection strings", async () => {
		const response = await action(
			remixArgs(
				new Request("http://localhost/monitor/new", {
					method: "POST",
					body: new URLSearchParams({
						_action: "new",
						title: "Example",
						type: "sqlServer",
					}),
				}),
			),
		);

		await expect(response.json()).resolves.toEqual({
			form: { error: "Connection string is required." },
		});
	});

	it("updates an existing monitor", async () => {
		editMonitorMock.mockResolvedValue({ id: "m1", type: "http" });

		const response = await action(
			remixArgs(
				new Request("http://localhost/monitor/new", {
					method: "POST",
					body: new URLSearchParams({
						_action: "new",
						id: "m1",
						title: "Example",
						type: "http",
						httpUrl: "https://example.com",
						enabled: "true",
					}),
				}),
			),
		);

		await expect(response.json()).resolves.toEqual({
			monitor: { id: "m1", type: "http" },
		});
		expect(editMonitorMock).toHaveBeenCalled();
	});

	it("tests an http monitor connection", async () => {
		httpCheckMock.mockResolvedValue({
			res: { status: 200, statusText: "OK" },
		});

		const response = await action(
			remixArgs(
				new Request("http://localhost/monitor/new", {
					method: "POST",
					body: new URLSearchParams({
						_action: "test",
						title: "Example",
						type: "http",
						httpUrl: "https://example.com",
					}),
				}),
			),
		);

		const body = await response.json();
		expect(body.success).toMatch(/Connected with 200 OK/);
	});

	it("tests a tcp monitor connection", async () => {
		tcpCheckMock.mockResolvedValue({ avg: 12 });

		const response = await action(
			remixArgs(
				new Request("http://localhost/monitor/new", {
					method: "POST",
					body: new URLSearchParams({
						_action: "test",
						title: "Example",
						type: "tcp",
						host: "127.0.0.1",
						port: "8080",
					}),
				}),
			),
		);

		await expect(response.json()).resolves.toEqual({
			success: "Connection successful.",
		});
	});
});
