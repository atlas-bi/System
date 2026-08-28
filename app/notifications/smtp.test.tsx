// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock("nodemailer", () => ({
	default: {
		createTransport: vi.fn(() => ({ sendMail })),
	},
}));

vi.mock("@/lib/utils", () => ({
	decrypt: vi.fn((value: string) => `decrypted:${value}`),
}));

import SMTP from "./smtp";

const notification = {
	smtpHost: "smtp.example.com",
	smtpPort: 587,
	smtpToEmail: "ops@example.com",
	smtpFromEmail: "atlas@example.com",
	smtpFromName: "Atlas",
	smtpSecurity: "STARTTLS",
	ignoreSSLErrors: false,
	smtpUsername: "user",
	smtpPassword: "encrypted-password",
} as never;

describe("SMTP notifier", () => {
	beforeEach(() => {
		sendMail.mockClear();
	});

	it("sends email through nodemailer", async () => {
		await expect(
			SMTP({
				notification,
				subject: "Alert",
				message: "<p>offline</p>",
			}),
		).resolves.toBe("Sent Successfully.");

		expect(sendMail).toHaveBeenCalledWith({
			from: '"Atlas" atlas@example.com',
			to: "ops@example.com",
			subject: "Alert",
			html: "<p>offline</p>",
		});
	});

	it("requires SMTP host and recipient configuration", async () => {
		await expect(
			SMTP({
				notification: { ...notification, smtpHost: null },
				subject: "Alert",
				message: "offline",
			}),
		).rejects.toThrow("SMTP host and port are required");
	});
});
