// @vitest-environment node

import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requestMock =
	vi.fn<(args: AxiosRequestConfig) => Promise<Partial<AxiosResponse>>>();
const ntlmClientMock =
	vi.fn<() => (args: AxiosRequestConfig) => Promise<Partial<AxiosResponse>>>();
const {
	monitorErrorMock,
	updateMonitorMock,
	notifierMock,
	checkCertificateMock,
} = vi.hoisted(() => ({
	monitorErrorMock: vi.fn(),
	updateMonitorMock: vi.fn(),
	notifierMock: vi.fn(),
	checkCertificateMock: vi.fn(),
}));

vi.mock("axios", () => ({
	default: {
		request: requestMock,
	},
	request: requestMock,
}));

vi.mock("axios-ntlm", () => ({
	NtlmClient: ntlmClientMock,
}));

vi.mock("~/notifications/notifier", () => ({
	default: notifierMock,
}));

vi.mock("~/models/monitor.server", () => ({
	monitorError: monitorErrorMock,
	updateMonitor: updateMonitorMock,
	setFeedError: vi.fn(),
}));

vi.mock("@/lib/utils", () => ({
	decrypt: vi.fn((value: string) => `decrypted:${value}`),
}));

vi.mock("./helpers.server", () => ({
	checkCertificate: checkCertificateMock,
}));

describe("HttpCheck", () => {
	beforeEach(() => {
		requestMock.mockReset();
		ntlmClientMock.mockReset();
		checkCertificateMock.mockReset();
		updateMonitorMock.mockReset();
		monitorErrorMock.mockReset();
		notifierMock.mockReset();
		updateMonitorMock.mockResolvedValue({});
		notifierMock.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("builds a basic-auth JSON request for axios", async () => {
		requestMock.mockResolvedValue({
			status: 200,
			data: { ok: true },
			request: { res: { socket: { getPeerCertificate: vi.fn() } } },
		});

		const { HttpCheck } = await import("./http.server");

		await HttpCheck({
			httpAuthentication: "basic",
			httpUsername: "atlas",
			httpPassword: "secret",
			httpUrl: "https://atlas.test/health",
			httpMethod: "POST",
			httpBody: JSON.stringify({ alive: true }),
			httpHeaders: JSON.stringify({ "X-Test": "1" }),
			httpAcceptedStatusCodes: ["200s"],
		});

		expect(requestMock).toHaveBeenCalledTimes(1);
		const options = requestMock.mock.calls[0][0];
		expect(options.url).toBe("https://atlas.test/health");
		expect(options.method).toBe("post");
		expect(options.data).toEqual({ alive: true });
		expect(options.headers).toMatchObject({
			Authorization:
				"Basic " + Buffer.from("atlas:decrypted:secret").toString("base64"),
			"Content-Type": "application/json",
			"X-Test": "1",
		});
		expect(options.validateStatus?.(204)).toBe(true);
		expect(options.validateStatus?.(500)).toBe(false);
	});

	it("uses the NTLM client when configured", async () => {
		const ntlmRequest = vi.fn().mockResolvedValue({
			status: 200,
			data: { ok: true },
			request: { res: { socket: { getPeerCertificate: vi.fn() } } },
		});
		ntlmClientMock.mockReturnValue(ntlmRequest);

		const { HttpCheck } = await import("./http.server");

		await HttpCheck({
			httpAuthentication: "ntlm",
			httpUsername: "atlas",
			httpPassword: "secret",
			httpDomain: "ATLAS",
			httpWorkstation: "monitor-box",
			httpUrl: "https://atlas.test/ntlm",
			httpMethod: "GET",
		});

		expect(ntlmClientMock).toHaveBeenCalledWith({
			username: "atlas",
			password: "decrypted:secret",
			domain: "ATLAS",
			workstation: "monitor-box",
		});
		expect(ntlmRequest).toHaveBeenCalledTimes(1);
		expect(requestMock).not.toHaveBeenCalled();
	});

	it("fails for invalid JSON bodies before any request is sent", async () => {
		const { HttpCheck } = await import("./http.server");

		await expect(
			HttpCheck({
				httpUrl: "https://atlas.test/health",
				httpBodyEncoding: "json",
				httpBody: "{not-valid-json}",
			}),
		).rejects.toThrow("JSON body is invalid.");

		expect(requestMock).not.toHaveBeenCalled();
		expect(ntlmClientMock).not.toHaveBeenCalled();
	});

	it("does not verify TLS when cert checking is disabled", async () => {
		requestMock.mockResolvedValue({
			status: 200,
			data: { ok: true },
			request: { res: { socket: { getPeerCertificate: vi.fn() } } },
		});

		const { HttpCheck } = await import("./http.server");

		await HttpCheck({
			httpUrl: "https://atlas.test/health",
			httpCheckCert: false,
			httpIgnoreSsl: false,
		});

		const options = requestMock.mock.calls[0][0];
		expect(options.httpsAgent?.options.rejectUnauthorized).toBe(false);
	});

	it("honors ignore SSL when cert checking is not explicitly disabled", async () => {
		requestMock.mockResolvedValue({
			status: 200,
			data: { ok: true },
			request: { res: { socket: { getPeerCertificate: vi.fn() } } },
		});

		const { HttpCheck } = await import("./http.server");

		await HttpCheck({
			httpUrl: "https://atlas.test/health",
			httpIgnoreSsl: true,
		});

		const options = requestMock.mock.calls[0][0];
		expect(options.httpsAgent?.options.rejectUnauthorized).toBe(false);
	});

	it("does not fail the check on TLS errors when cert checking is disabled", async () => {
		const tlsError = Object.assign(
			new Error("unable to verify the first certificate"),
			{
				code: "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
			},
		);
		requestMock.mockRejectedValue(tlsError);

		const { HttpCheck } = await import("./http.server");

		await expect(
			HttpCheck({
				httpUrl: "https://atlas.test/health",
				httpCheckCert: false,
			}),
		).resolves.toMatchObject({ certValid: undefined });
	});

	it("records an invalid cert instead of failing when TLS errors and cert checking is on", async () => {
		const tlsError = Object.assign(new Error("self-signed certificate"), {
			code: "DEPTH_ZERO_SELF_SIGNED_CERT",
		});
		requestMock.mockRejectedValue(tlsError);

		const { HttpCheck } = await import("./http.server");

		await expect(
			HttpCheck({
				httpUrl: "https://atlas.test/health",
				httpCheckCert: true,
			}),
		).resolves.toMatchObject({ certValid: false });
	});

	it("still fails on HTTP 4xx errors when cert checking is disabled", async () => {
		const error = Object.assign(
			new Error("Request failed with status code 400"),
			{
				code: "ERR_BAD_REQUEST",
				response: { status: 400 },
			},
		);
		requestMock.mockRejectedValue(error);

		const { HttpCheck } = await import("./http.server");

		await expect(
			HttpCheck({
				httpUrl: "https://atlas.test/health",
				httpCheckCert: false,
			}),
		).rejects.toThrow("Request failed with status code 400");
	});

	it("accepts xml bodies and status-code ranges", async () => {
		requestMock.mockResolvedValue({
			status: 301,
			data: "<ok/>",
			request: { res: { socket: { getPeerCertificate: vi.fn() } } },
		});

		const { HttpCheck } = await import("./http.server");

		await HttpCheck({
			httpUrl: "https://atlas.test/health",
			httpBody: "<ping/>",
			httpBodyEncoding: "xml",
			httpAcceptedStatusCodes: ["300s"],
		});

		const options = requestMock.mock.calls[0][0];
		expect(options.data).toBe("<ping/>");
		expect(options.headers?.["Content-Type"]).toBe("text/xml; charset=utf-8");
		expect(options.validateStatus?.(301)).toBe(true);
		expect(options.validateStatus?.(200)).toBe(false);
	});

	it("stores certificate details when cert checking is enabled", async () => {
		requestMock.mockResolvedValue({
			status: 200,
			data: { ok: true },
			request: { res: { socket: { getPeerCertificate: vi.fn() } } },
		});
		checkCertificateMock.mockReturnValue({
			valid: true,
			certInfo: { daysRemaining: 45 },
		});

		const { HttpCheck } = await import("./http.server");

		await expect(
			HttpCheck({
				httpUrl: "https://atlas.test/health",
				httpCheckCert: true,
			}),
		).resolves.toEqual({
			res: expect.objectContaining({ status: 200 }),
			certValid: true,
			certDays: 45,
		});
	});

	it("validates additional status-code ranges and exact codes", async () => {
		requestMock.mockResolvedValue({
			status: 404,
			data: {},
			request: { res: { socket: { getPeerCertificate: vi.fn() } } },
		});

		const { HttpCheck } = await import("./http.server");

		await HttpCheck({
			httpUrl: "https://atlas.test/health",
			httpAcceptedStatusCodes: ["100s", "400s", "404", "500s"],
		});

		const options = requestMock.mock.calls[0][0];
		expect(options.validateStatus?.(100)).toBe(true);
		expect(options.validateStatus?.(404)).toBe(true);
		expect(options.validateStatus?.(500)).toBe(true);
		expect(options.validateStatus?.(600)).toBe(false);
	});

	it("accepts a single configured status code", async () => {
		requestMock.mockResolvedValue({
			status: 204,
			data: {},
			request: { res: { socket: { getPeerCertificate: vi.fn() } } },
		});

		const { HttpCheck } = await import("./http.server");

		await HttpCheck({
			httpUrl: "https://atlas.test/health",
			httpAcceptedStatusCodes: "204" as never,
		});

		const options = requestMock.mock.calls[0][0];
		expect(options.validateStatus?.(204)).toBe(true);
		expect(options.validateStatus?.(200)).toBe(false);
	});

	it("accepts any status code when none are configured", async () => {
		requestMock.mockResolvedValue({
			status: 503,
			data: {},
			request: { res: { socket: { getPeerCertificate: vi.fn() } } },
		});

		const { HttpCheck } = await import("./http.server");

		await HttpCheck({
			httpUrl: "https://atlas.test/health",
			httpAcceptedStatusCodes: [],
		});

		const options = requestMock.mock.calls[0][0];
		expect(options.validateStatus?.(503)).toBe(true);
	});

	it("surfaces certificate parsing failures when cert checking is enabled", async () => {
		requestMock.mockResolvedValue({
			status: 200,
			data: { ok: true },
			request: { res: { socket: { getPeerCertificate: vi.fn() } } },
		});
		checkCertificateMock.mockImplementation(() => {
			throw new Error("No socket found");
		});

		const { HttpCheck } = await import("./http.server");

		await expect(
			HttpCheck({
				httpUrl: "https://atlas.test/health",
				httpCheckCert: true,
			}),
		).rejects.toThrow("No socket found");
	});
});

describe("HttpMonitor", () => {
	it("records a successful check and notifies subscribers", async () => {
		requestMock.mockResolvedValue({
			status: 200,
			data: { ok: true },
			request: { res: { socket: { getPeerCertificate: vi.fn() } } },
		});
		const HttpMonitor = (await import("./http.server")).default;

		await HttpMonitor({
			monitor: {
				id: "http-1",
				type: "http",
				httpUrl: "https://atlas.test/health",
				httpCheckCert: false,
			} as never,
		});

		expect(updateMonitorMock).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "http-1",
				data: { certValid: null, certDays: null },
				feed: { ping: expect.any(String) },
			}),
		);
		expect(notifierMock).toHaveBeenCalledWith({ job: "http-1" });
		expect(monitorErrorMock).not.toHaveBeenCalled();
	});

	it("records certificate metadata when cert checking is enabled", async () => {
		requestMock.mockResolvedValue({
			status: 200,
			data: { ok: true },
			request: { res: { socket: { getPeerCertificate: vi.fn() } } },
		});
		checkCertificateMock.mockReturnValue({
			valid: true,
			certInfo: { daysRemaining: 45 },
		});
		const HttpMonitor = (await import("./http.server")).default;

		await HttpMonitor({
			monitor: {
				id: "http-1",
				type: "http",
				httpUrl: "https://atlas.test/health",
				httpCheckCert: true,
			} as never,
		});

		expect(updateMonitorMock).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { certValid: true, certDays: "45" },
			}),
		);
	});

	it("marks the monitor as failed when the HTTP check throws", async () => {
		requestMock.mockRejectedValue(new Error("connection refused"));
		const HttpMonitor = (await import("./http.server")).default;

		await HttpMonitor({
			monitor: {
				id: "http-1",
				type: "http",
				httpUrl: "https://atlas.test/health",
				httpCheckCert: false,
			} as never,
		});

		expect(monitorErrorMock).toHaveBeenCalledWith({ id: "http-1" });
		expect(notifierMock).toHaveBeenCalledWith({
			job: "http-1",
			message: "Error: connection refused",
		});
	});
});
