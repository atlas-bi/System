// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.hoisted(() => vi.fn().mockResolvedValue({ status: 204 }));

vi.mock("axios", () => ({
	default: { post },
}));

vi.mock("@/lib/utils", () => ({
	decrypt: vi.fn((value: string) => `decrypted:${value}`),
}));

import Discord from "./discord";

const WEBHOOK = "https://discord.com/api/webhooks/123/abc";

const notification = {
	discordWebhookUrl: "encrypted-url",
} as never;

describe("Discord notifier", () => {
	beforeEach(() => {
		post.mockClear();
		post.mockResolvedValue({ status: 204 });
	});

	it("posts the message to the decrypted webhook URL", async () => {
		await Discord({ notification, message: "Alert: offline" });

		expect(post).toHaveBeenCalledWith(
			"decrypted:encrypted-url",
			{
				content: "Alert: offline",
				allowed_mentions: { parse: [] },
			},
			{ headers: { "Content-Type": "application/json" } },
		);
	});

	it("uses the raw URL for test sends and trims whitespace", async () => {
		await Discord({
			notification: { discordWebhookUrl: `  ${WEBHOOK}\n` } as never,
			message: "connection test",
			test: true,
		});

		expect(post.mock.calls[0][0]).toBe(WEBHOOK);
	});

	it("truncates content to Discord's 2000 character limit", async () => {
		await Discord({ notification, message: "x".repeat(2500) });

		expect(post.mock.calls[0][1].content).toHaveLength(2000);
	});

	it("surfaces the Discord API error message", async () => {
		post.mockRejectedValue({
			response: { data: { message: "Unknown Webhook", code: 10015 } },
		});

		await expect(
			Discord({ notification, message: "Alert: offline" }),
		).rejects.toThrow("Unknown Webhook");
	});

	it("rejects when no webhook URL is configured", async () => {
		await expect(
			Discord({
				notification: { discordWebhookUrl: null } as never,
				message: "Alert: offline",
			}),
		).rejects.toThrow("Webhook URL is required.");

		expect(post).not.toHaveBeenCalled();
	});
});
