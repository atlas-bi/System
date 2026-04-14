import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
	const email = "rachel@remix.run";
	const slug = "rachel";

	await prisma.user.upsert({
		where: { email },
		create: {
			email,
			slug,
		},
		update: {},
	});
}

seed()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
