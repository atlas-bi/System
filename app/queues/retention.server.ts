import { CronJob } from "quirrel/remix";
import { prisma } from "~/db.server";

export async function deleteExpiredUsageData(cutoff: Date) {
	// ponytail: one deleteMany per table; batch deletion can be added if daily volume makes locks too large.
	await prisma.monitorFeeds.deleteMany({ where: { createdAt: { lt: cutoff } } });
	await prisma.cpuUsage.deleteMany({ where: { createdAt: { lt: cutoff } } });
	await prisma.databaseFileUsage.deleteMany({
		where: { createdAt: { lt: cutoff } },
	});
	await prisma.databaseUsage.deleteMany({ where: { createdAt: { lt: cutoff } } });
	await prisma.driveUsage.deleteMany({ where: { createdAt: { lt: cutoff } } });
}

export default CronJob("/queues/retention", "0 2 * * *", async () => {
	const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
	const months = settings?.usageRetentionMonths;

	if (!settings?.usageRetentionEnabled || !months) {
		return;
	}

	const cutoff = new Date();
	cutoff.setMonth(cutoff.getMonth() - months);
	await deleteExpiredUsageData(cutoff);
});
