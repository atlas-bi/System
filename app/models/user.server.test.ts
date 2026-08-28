// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, create, update } = vi.hoisted(() => ({
	findUnique: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
}));

vi.mock("~/db.server", () => ({
	prisma: {
		user: { findUnique, create, update },
		group: { findUnique, create },
	},
}));

import {
	createUser,
	getOrCreateUser,
	getUserById,
	getUserBySlug,
	updateUserProps,
} from "./user.server";

describe("user.server", () => {
	beforeEach(() => {
		findUnique.mockReset();
		create.mockReset();
	});

	it("creates users with a slug derived from their email", async () => {
		const user = {
			id: "user-1",
			email: "jane.doe@example.com",
			firstName: null,
			lastName: null,
			slug: "jane-doe",
		};
		create.mockResolvedValue(user);

		await expect(createUser("jane.doe@example.com")).resolves.toEqual(user);
		expect(create).toHaveBeenCalledWith({
			data: {
				email: "jane.doe@example.com",
				slug: "jane-doe",
			},
			select: expect.any(Object),
		});
	});

	it("returns an existing user from getOrCreateUser", async () => {
		const user = {
			id: "user-1",
			email: "jane@example.com",
			firstName: "Jane",
			lastName: "Doe",
			slug: "jane",
		};
		findUnique.mockResolvedValue(user);

		await expect(getOrCreateUser("jane@example.com")).resolves.toEqual(user);
		expect(create).not.toHaveBeenCalled();
	});

	it("creates a user when getOrCreateUser does not find one", async () => {
		const user = {
			id: "user-2",
			email: "new@example.com",
			firstName: null,
			lastName: null,
			slug: "new",
		};
		findUnique.mockResolvedValue(null);
		create.mockResolvedValue(user);

		await expect(getOrCreateUser("new@example.com")).resolves.toEqual(user);
		expect(create).toHaveBeenCalled();
	});

	it("loads users by id and slug", async () => {
		const user = { id: "user-1", slug: "jane" };
		findUnique.mockResolvedValue(user);

		await getUserById("user-1");
		await getUserBySlug("jane");

		expect(findUnique).toHaveBeenCalledTimes(2);
	});

	it("updates user profile properties and groups", async () => {
		findUnique
			.mockResolvedValueOnce({
				id: "user-1",
				email: "jane@example.com",
				firstName: null,
				lastName: null,
				slug: "jane",
			})
			.mockResolvedValueOnce({ id: 1, name: "Admins" });
		update.mockResolvedValue({
			id: "user-1",
			email: "jane@example.com",
			firstName: "Jane",
			lastName: "Doe",
			slug: "jane",
		});

		await updateUserProps(
			"jane@example.com",
			"Jane",
			"Doe",
			["Admins"],
			"photo.png",
		);

		expect(update).toHaveBeenCalledWith({
			where: { email: "jane@example.com" },
			data: expect.objectContaining({
				firstName: "Jane",
				lastName: "Doe",
				profilePhoto: "photo.png",
				groups: { set: [{ id: 1 }] },
			}),
			select: expect.any(Object),
		});
	});
});
