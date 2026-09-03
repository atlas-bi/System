// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { create, update, encryptMock, findMany, deleteMany, findUnique } =
	vi.hoisted(() => ({
		create: vi.fn(),
		update: vi.fn(),
		encryptMock: vi.fn((value: string) => `encrypted:${value}`),
		findMany: vi.fn(),
		deleteMany: vi.fn(),
		findUnique: vi.fn(),
	}));

vi.mock("~/db.server", () => ({
	prisma: {
		notification: { create, update, findMany, deleteMany, findUnique },
	},
}));

vi.mock("@/lib/utils", () => ({
	encrypt: encryptMock,
}));

import {
	createNotification,
	editNotification,
	getNotifications,
	getNotificationsDetail,
	deleteNotification,
	getNotificationConnection,
} from "./notification.server";

describe("notification.server", () => {
	beforeEach(() => {
		create.mockClear();
		update.mockClear();
		encryptMock.mockClear();
	});

	it("encrypts sensitive fields when creating a notification", async () => {
		create.mockResolvedValue({ id: "n1" });

		await createNotification({
			name: "Email",
			type: "smtp",
			smtpPort: 587,
			smtpUsername: "user",
			smtpHost: "smtp.example.com",
			smtpPassword: "secret",
			smtpSecurity: "starttls",
			ignoreSSLErrors: false,
			smtpFromName: "Atlas",
			smtpFromEmail: "atlas@example.com",
			smtpToEmail: "ops@example.com",
			tgBotToken: "bot-token",
			tgChatId: "123",
			tgThreadId: null,
			tgSendSilently: false,
			tgProtectMessage: false,
		});

		expect(create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				smtpPassword: "encrypted:secret",
				tgBotToken: "encrypted:bot-token",
			}),
		});
	});

	it("leaves blank secrets unchanged when editing a notification", async () => {
		update.mockResolvedValue({ id: "n1" });

		await editNotification({
			id: "n1",
			name: "Email",
			type: "smtp",
			smtpPort: 587,
			smtpUsername: "user",
			smtpHost: "smtp.example.com",
			smtpPassword: "",
			smtpSecurity: "starttls",
			ignoreSSLErrors: false,
			smtpFromName: "Atlas",
			smtpFromEmail: "atlas@example.com",
			smtpToEmail: "ops@example.com",
			tgBotToken: "",
			tgChatId: "123",
			tgThreadId: null,
			tgSendSilently: false,
			tgProtectMessage: false,
		});

		expect(update).toHaveBeenCalledWith({
			where: { id: "n1" },
			data: expect.objectContaining({
				smtpPassword: null,
				tgBotToken: null,
			}),
		});
		expect(encryptMock).not.toHaveBeenCalled();
	});

	it("loads and deletes notifications", async () => {
		findMany.mockResolvedValue([{ id: "n1", name: "Email", type: "smtp" }]);
		findUnique.mockResolvedValue({ id: "n1", type: "smtp" });
		deleteMany.mockResolvedValue({ count: 1 });

		await getNotifications();
		await getNotificationsDetail();
		await getNotificationConnection({ id: "n1" });
		await deleteNotification({ id: "n1" });

		expect(findMany).toHaveBeenCalledTimes(2);
		expect(findUnique).toHaveBeenCalledWith({ where: { id: "n1" } });
		expect(deleteMany).toHaveBeenCalledWith({ where: { id: "n1" } });
	});
});
