// @vitest-environment node

import type { AxiosResponse } from "axios";
import { describe, expect, it, vi } from "vitest";
import { checkCertificate, disposeSsh } from "./helpers.server";

describe("disposeSsh", () => {
	it("ends and disposes an active connection", () => {
		const end = vi.fn();
		const on = vi.fn();
		const dispose = vi.fn();
		const ssh = {
			connection: { on },
			getConnection: () => ({ end }),
			dispose,
		};

		disposeSsh(ssh as never);

		expect(end).toHaveBeenCalled();
		expect(on).toHaveBeenCalledWith("error", expect.any(Function));
		expect(dispose).toHaveBeenCalled();
	});

	it("ignores ssh clients without an open connection", () => {
		const dispose = vi.fn();
		disposeSsh({ connection: null, dispose } as never);
		expect(dispose).not.toHaveBeenCalled();
	});

	it("swallows connection errors while closing", () => {
		const end = vi.fn();
		let errorHandler: (() => void) | undefined;
		const on = vi.fn((event: string, handler: () => void) => {
			if (event === "error") errorHandler = handler;
		});
		const dispose = vi.fn();

		disposeSsh({
			connection: { on },
			getConnection: () => ({ end }),
			dispose,
		} as never);

		expect(() => errorHandler?.()).not.toThrow();
	});
});

describe("checkCertificate", () => {
	it("throws when the response has no socket", () => {
		expect(() => checkCertificate({ request: {} } as AxiosResponse)).toThrow(
			"No socket found",
		);
	});

	it("parses a valid peer certificate chain", () => {
		const future = new Date(
			Date.now() + 30 * 24 * 60 * 60 * 1000,
		).toISOString();
		const getPeerCertificate = vi.fn().mockReturnValue({
			valid_from: new Date().toISOString(),
			valid_to: future,
			fingerprint: "server-cert",
			subjectaltname: "DNS:example.com, IP Address:127.0.0.1",
			issuerCertificate: {
				valid_from: new Date().toISOString(),
				valid_to: future,
				fingerprint: "root-cert",
				subjectaltname: "DNS:ca.example.com",
				issuerCertificate: {
					fingerprint: "root-cert",
				},
			},
		});

		const result = checkCertificate({
			request: {
				res: {
					socket: {
						authorized: true,
						getPeerCertificate,
					},
				},
			},
		} as AxiosResponse);

		expect(result.valid).toBe(true);
		expect(result.certInfo.certType).toBe("server");
		expect(result.certInfo.daysRemaining).toBeGreaterThan(0);
		expect(result.certInfo.validFor).toEqual(["example.com", "127.0.0.1"]);
	});

	it("ignores certificates missing validity dates", () => {
		const getPeerCertificate = vi.fn().mockReturnValue({
			fingerprint: "incomplete",
			issuerCertificate: null,
		});

		const result = checkCertificate({
			request: {
				res: {
					socket: {
						authorized: false,
						getPeerCertificate,
					},
				},
			},
		} as AxiosResponse);

		expect(result.valid).toBe(false);
		expect(result.certInfo.fingerprint).toBe("incomplete");
	});

	it("reads certificates from nested request sockets", () => {
		const getPeerCertificate = vi.fn().mockReturnValue({
			valid_from: new Date().toISOString(),
			valid_to: new Date(Date.now() + 86400000).toISOString(),
			fingerprint: "leaf",
			issuerCertificate: null,
		});

		const result = checkCertificate({
			request: {
				res: {
					req: {
						socket: {
							authorized: false,
							getPeerCertificate,
						},
					},
				},
			},
		} as AxiosResponse);

		expect(result.valid).toBe(false);
		expect(result.certInfo.certType).toBe("self-signed");
	});
});
