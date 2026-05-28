// @vitest-environment node

import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requestMock =
	vi.fn<(args: AxiosRequestConfig) => Promise<Partial<AxiosResponse>>>();
const ntlmClientMock =
	vi.fn<() => (args: AxiosRequestConfig) => Promise<Partial<AxiosResponse>>>();

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
	default: vi.fn(),
}));

vi.mock("~/models/monitor.server", () => ({
	monitorError: vi.fn(),
	updateMonitor: vi.fn(),
	setFeedError: vi.fn(),
}));

vi.mock("@/lib/utils", () => ({
	decrypt: vi.fn((value: string) => `decrypted:${value}`),
}));

describe("HttpCheck", () => {
	beforeEach(() => {
		requestMock.mockReset();
		ntlmClientMock.mockReset();
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
});
