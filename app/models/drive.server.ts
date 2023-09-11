import { Drive } from '@prisma/client';
import { prisma } from '~/db.server';
import searchLoader from '~/queues/searchService.server';

export type { Drive, DriveUsage } from '@prisma/client';

export async function deleteDrive({ id }: Pick<Drive, 'id'>) {
	// delete drive usage
	await prisma.driveUsage.deleteMany({
		where: {
			drive: { id },
		},
	});

	// delete drive logs
	await prisma.monitorLogs.deleteMany({
		where: {
			drive: { id },
		},
	});

	// delete drives
	await prisma.drive.deleteMany({
		where: { id },
	});
	searchLoader.enqueue(id);
}

export function getDriveMonitor({ id }: { id: Drive['id'] }) {
	return prisma.drive.findUnique({
		where: { id },
		select: {
			monitor: { select: { id: true, type: true } },
		},
	});
}

export function getDriveMeta({ id }: Pick<Drive, 'id'>) {
	return prisma.drive.findUnique({
		where: { id },
		select: {
			id: true,
			title: true,
			enabled: true,
			hasError: true,
			monitorId: true,
			location: true,
			name: true,
			root: true,
			systemDescription: true,
			description: true,
			size: true,
			online: true,
			monitor: {
				select: {
					title: true,
					id: true,
					type: true,
					name: true,
				},
			},
		},
	});
}

export function getDriveNotifications({ id }: Pick<Drive, 'id'>) {
	let lastMonth = new Date();
	lastMonth = new Date(lastMonth.setMonth(lastMonth.getMonth() - 1));
	return prisma.drive.findUnique({
		where: { id },
		select: {
			id: true,
			title: true,
			name: true,
			location: true,
			percFreeNotifyResendAfterMinutes: true,
			percFreeValue: true,
			percFreeNotify: true,
			percFreeNotifyTypes: {
				select: {
					id: true,
					type: true,
					name: true,
				},
			},
		},
	});
}

export function updateDriveNotifications({
	id,
	missingNotify,
	missingNotifyTypes,
	missingNotifyResendAfterMinutes,
	percFreeNotify,
	percFreeNotifyTypes,
	percFreeNotifyResendAfterMinutes,
	percFreeValue,
	sizeFreeNotify,
	sizeFreeNotifyTypes,
	sizeFreeNotifyResendAfterMinutes,
	sizeFreeValue,
	growthRateNotify,
	growthRateNotifyTypes,
	growthRateNotifyResendAfterMinutes,
	growthRateValue,
}: Pick<
	Drive,
	| 'id'
	| 'percFreeValue'
	| 'sizeFreeValue'
	| 'growthRateValue'
	| 'missingNotify'
	| 'missingNotifyResendAfterMinutes'
	| 'percFreeNotify'
	| 'percFreeNotifyResendAfterMinutes'
	| 'sizeFreeNotify'
	| 'sizeFreeNotifyResendAfterMinutes'
	| 'growthRateNotify'
	| 'growthRateNotifyResendAfterMinutes'
> & {
	percFreeNotifyTypes: string[];
	growthRateNotifyTypes: string[];
	missingNotifyTypes: string[];
	sizeFreeNotifyTypes: string[];
}) {
	return prisma.drive.update({
		where: { id },
		data: {
			missingNotify,
			missingNotifyTypes: missingNotifyTypes
				? { set: missingNotifyTypes.map((x) => ({ id: x })) }
				: undefined,
			missingNotifyResendAfterMinutes,

			percFreeNotify,
			percFreeNotifyTypes: percFreeNotifyTypes
				? { set: percFreeNotifyTypes.map((x: string) => ({ id: x })) }
				: undefined,
			percFreeNotifyResendAfterMinutes,
			percFreeValue,

			sizeFreeNotify,
			sizeFreeNotifyTypes: sizeFreeNotifyTypes
				? { set: sizeFreeNotifyTypes.map((x: string) => ({ id: x })) }
				: undefined,
			sizeFreeNotifyResendAfterMinutes,
			sizeFreeValue,

			growthRateNotify,
			growthRateNotifyTypes: growthRateNotifyTypes
				? { set: growthRateNotifyTypes.map((x: string) => ({ id: x })) }
				: undefined,
			growthRateNotifyResendAfterMinutes,
			growthRateValue,
		},
	});
}

export function getDriveUsage({
	id,
	startDate,
	endDate,
}: Pick<Drive, 'id'> & { startDate: Date; endDate: Date }) {
	let lastMonth = new Date();
	lastMonth = new Date(lastMonth.setMonth(lastMonth.getMonth() - 1));
	return prisma.drive.findUnique({
		where: { id },
		select: {
			id: true,
			title: true,
			monitorId: true,
			location: true,
			enabled: true,
			name: true,
			description: true,
			systemDescription: true,
			size: true,
			monitor: {
				select: {
					title: true,
					id: true,
					type: true,
				},
			},
			usage: {
				select: {
					id: true,
					free: true,
					used: true,
					createdAt: true,
				},
				where: {
					createdAt: {
						gte: startDate,
						lt: endDate,
					},
				},
				orderBy: { createdAt: 'desc' },
			},
		},
	});
}

export function getDriveLatestFeed({ id }: Pick<Drive, 'id'>) {
	return prisma.driveUsage.findFirst({
		where: { driveId: id },
		select: {
			id: true,
			hasError: true,
			createdAt: true,
			free: true,
			used: true,
		},
		take: 1,
		orderBy: {
			createdAt: 'desc',
		},
	});
}

export function getDriveLatestFeeds({ id }: Pick<Drive, 'id'>) {
	return prisma.driveUsage.findMany({
		where: { driveId: id },
		select: {
			id: true,
			hasError: true,
			createdAt: true,
		},
		take: 30,
		orderBy: {
			createdAt: 'desc',
		},
	});
}

export function editDrive({
	id,
	title,
	description,
	enabled,
}: Pick<Drive, 'id' | 'title' | 'description' | 'enabled'>) {
	return prisma.drive.update({
		where: { id },
		data: {
			title,
			description,
			enabled,
		},
		select: {
			id: true,
		},
	});
}

export function setDriveOnline({ id, online }: Pick<Drive, 'id' | 'online'>) {
	return prisma.drive.update({
		where: { id },
		data: { online },
	});
}

export function setDrivePercFreeSentAt({
	id,
	percFreeNotifySentAt,
}: Pick<Drive, 'id' | 'percFreeNotifySentAt'>) {
	return prisma.drive.update({
		where: { id },
		data: { percFreeNotifySentAt },
	});
}
