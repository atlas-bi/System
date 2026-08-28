// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { ok: true } }));

vi.mock("axios", () => ({
	default: { get },
}));

vi.mock("@/lib/utils", () => ({
	decrypt: vi.fn((value: string) => `decrypted:${value}`),
}));

import Telegram from "./telegram";

const notification = {
	tgChatId: "123",
	tgBotToken: "encrypted-token",
	tgSendSilently: false,
	tgProtectMessage: true,
	tgThreadId: "456",
} as never;

describe("Telegram notifier", () => {
	beforeEach(() => {
		get.mockClear();
	});

	it("sends a Telegram message", async () => {
		await Telegram({
			notification,
			message: "Alert: offline",
		});

		expect(get).toHaveBeenCalledWith(
			"https://api.telegram.org/botdecrypted:encrypted-token/sendMessage",
			{
				params: {
					chat_id: "123",
					text: "Alert: offline",
					disable_notification: false,
					protect_content: true,
					message_thread_id: "456",
				},
			},
		);
	});

	it("surfaces Telegram API errors", async () => {
		get.mockRejectedValue({
			response: { data: { description: "chat not found" } },
		});

		await expect(
			Telegram({ notification, message: "Alert: offline" }),
		).rejects.toThrow("chat not found");
	});
});
