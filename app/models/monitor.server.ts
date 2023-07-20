import { encrypt } from '@/lib/utils';
import type { Monitor, MonitorLogs, User } from '@prisma/client';
import { prisma } from '~/db.server';
import monitorMonitor from '~/queues/monitor.server';

export type { Monitor, Drive, DriveUsage, MonitorLogs } from '@prisma/client';

export function getMonitorPublic({ id }: Pick<Monitor, 'id'>) {
	return prisma.monitor.findUnique({
		where: { id },
		select: {
			id: true,
			type: true,
			host: true,
			os: true,
			osVersion: true,
			title: true,
		},
	});
}

export function getMonitorNotifications({ id }: Pick<Monitor, 'id'>) {
	return prisma.monitor.findUnique({
		where: { id },
		select: {
			id: true,
			type: true,
			host: true,
			os: true,
			osVersion: true,
			title: true,
		},
	});
}
export function getMonitor({ id }: Pick<Monitor, 'id'>) {
	return prisma.monitor.findFirst({
		where: { id },
		select: {
			id: true,
			username: true,
			host: true,
			password: true,
			port: true,
			privateKey: true,
			drives: {
				select: {
					id: true,
					hasError: true,
					inactive: true,
					location: true,
					name: true,
					root: true,
					description: true,
					size: true,
					daysTillFull: true,
					growthRate: true,
					missingNotify: true,
					missingNotifyResendAfterMinutes: true,
					missingNotifySentAt: true,
					missingNotifyTypes: {
						select: {
							id: true,
							type: true,
							name: true,
							smtpPort: true,
							smtpUsername: true,
							smtpHost: true,
							smtpPassword: true,
							smtpSecurity: true,
							ignoreSSLErrors: true,
							smtpFromName: true,
							smtpFromEmail: true,
							smtpToEmail: true,
							tgBotToken: true,
							tgChatId: true,
							tgThreadId: true,
							tgSendSilently: true,
							tgProtectMessage: true,
						},
					},
					percFreeNotify: true,
					percFreeValue: true,
					percFreeNotifyResendAfterMinutes: true,
					percFreeNotifySentAt: true,
					percFreeNotifyTypes: {
						select: {
							id: true,
							type: true,
							name: true,
							smtpPort: true,
							smtpUsername: true,
							smtpHost: true,
							smtpPassword: true,
							smtpSecurity: true,
							ignoreSSLErrors: true,
							smtpFromName: true,
							smtpFromEmail: true,
							smtpToEmail: true,
							tgBotToken: true,
							tgChatId: true,
							tgThreadId: true,
							tgSendSilently: true,
							tgProtectMessage: true,
						},
					},
					sizeFreeNotify: true,
					sizeFreeValue: true,
					sizeFreeNotifyResendAfterMinutes: true,
					sizeFreeNotifySentAt: true,
					sizeFreeNotifyTypes: {
						select: {
							id: true,
							type: true,
							name: true,
							smtpPort: true,
							smtpUsername: true,
							smtpHost: true,
							smtpPassword: true,
							smtpSecurity: true,
							ignoreSSLErrors: true,
							smtpFromName: true,
							smtpFromEmail: true,
							smtpToEmail: true,
							tgBotToken: true,
							tgChatId: true,
							tgThreadId: true,
							tgSendSilently: true,
							tgProtectMessage: true,
						},
					},
					growthRateNotify: true,
					growthRateValue: true,
					growthRateNotifyResendAfterMinutes: true,
					growthRateNotifySentAt: true,
					growthRateNotifyTypes: {
						select: {
							id: true,
							type: true,
							name: true,
							smtpPort: true,
							smtpUsername: true,
							smtpHost: true,
							smtpPassword: true,
							smtpSecurity: true,
							ignoreSSLErrors: true,
							smtpFromName: true,
							smtpFromEmail: true,
							smtpToEmail: true,
							tgBotToken: true,
							tgChatId: true,
							tgThreadId: true,
							tgSendSilently: true,
							tgProtectMessage: true,
						},
					},
					usage: {
						select: {
							id: true,
							free: true,
							used: true,
						},
						take: 1,
					},
				},
			},
		},
	});
}

export function getMonitorTypes() {
	return prisma.monitor.groupBy({
		by: ['type'],
		_count: { type: true },
	});
}

export function monitorError({ id }: Pick<Monitor, 'id'>) {
	return prisma.monitor.update({
		where: { id },
		data: {
			hasError: true,
		},
	});
}

export function monitorLog({
	monitorId,
	driveId,
	type,
	message,
}: Pick<MonitorLogs, 'monitorId' | 'type' | 'message' | 'driveId'>) {
	return prisma.monitorLogs.create({
		data: { monitorId, type, message, driveId },
	});
}

export function getDriveNotifications({ id }: Pick<Drive, 'id'>) {
	let lastMonth = new Date();
	lastMonth = new Date(lastMonth.setMonth(lastMonth.getMonth() - 1));
	return prisma.drive.findUnique({
		where: { id },
		select: {
			id: true,
			monitorId: true,
			location: true,
			inactive: true,
			name: true,
			description: true,
			size: true,
			daysTillFull: true,
			growthRate: true,
			missingNotify: true,
			missingNotifyTypes: {
				select: {
					id: true,
					type: true,
				},
			},
			missingNotifyResendAfterMinutes: true,
			percFreeNotify: true,
			percFreeNotifyTypes: {
				select: {
					id: true,
					type: true,
				},
			},
			percFreeNotifyResendAfterMinutes: true,
			percFreeValue: true,
			sizeFreeNotify: true,
			sizeFreeNotifyTypes: {
				select: {
					id: true,
					type: true,
				},
			},
			sizeFreeNotifyResendAfterMinutes: true,
			sizeFreeValue: true,
			growthRateNotify: true,
			growthRateNotifyTypes: {
				select: {
					id: true,
					type: true,
				},
			},
			growthRateNotifyResendAfterMinutes: true,
			growthRateValue: true,
			monitor: {
				select: {
					title: true,
					id: true,
					type: true,
				},
			},
		},
	});
}

export function getDrive({ id }: Pick<Drive, 'id'>) {
	let lastMonth = new Date();
	lastMonth = new Date(lastMonth.setMonth(lastMonth.getMonth() - 1));
	return prisma.drive.findUnique({
		where: { id },
		select: {
			id: true,
			monitorId: true,
			location: true,
			inactive: true,
			name: true,
			description: true,
			size: true,
			daysTillFull: true,
			growthRate: true,
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
						gte: lastMonth,
					},
				},
				orderBy: { createdAt: 'desc' },
			},
		},
	});
}

export function getLatestMonitorErrorLog({
	driveId,
	monitorId,
}: Pick<MonitorLogs, 'driveId' | 'monitorId'>) {
	return prisma.monitorLogs.findFirst({
		where: {
			driveId,
			monitorId,
			type: 'error',
		},
		orderBy: {
			createdAt: 'desc',
		},
	});
}

export async function getMonitorLogs({
	monitorId,
	driveId,
	page = 0,
	size = 10,
}: Pick<MonitorLogs, 'monitorId' | 'driveId'> & {
	page?: number;
	size?: number;
}) {
	const logs = await prisma.$transaction([
		prisma.monitorLogs.count({
			where: {
				monitorId,
				driveId,
				NOT: {
					message: {
						contains: 'clientVersion',
						mode: 'insensitive',
					},
				},
			},
		}),
		prisma.monitorLogs.findMany({
			where: {
				monitorId,
				driveId,
				NOT: {
					message: {
						contains: 'clientVersion',
						mode: 'insensitive',
					},
				},
			},
			select: {
				id: true,
				message: true,
				type: true,
				createdAt: true,
				drive: {
					select: {
						id: true,
						name: true,
						location: true,
						root: true,
					},
				},
				monitor: {
					select: {
						id: true,
						type: true,
					},
				},
			},
			skip: page * size,
			take: size,
			orderBy: {
				createdAt: 'desc',
			},
		}),
	]);

	const count = logs[0] ?? 0;
	return {
		pages: count < size ? 1 : Math.ceil(count / size),
		logs: logs[1],
	};
}

export function getMonitorDrives({ monitorId }: { monitorId: Monitor['id'] }) {
	return prisma.drive.findMany({
		where: { monitorId },
		select: {
			id: true,
			monitorId: true,
			location: true,
			inactive: true,
			name: true,
			description: true,
			size: true,
			daysTillFull: true,
			growthRate: true,
			usage: {
				select: {
					id: true,
					free: true,
					used: true,
				},
				take: 1,
			},
		},
		orderBy: { name: 'asc' },
	});
}

export async function createMonitor({
	title,
	host,
	username,
	password,
	privateKey,
	port,
	type,
}: Pick<
	Monitor,
	'title' | 'port' | 'privateKey' | 'username' | 'password' | 'host' | 'type'
>) {
	const monitor = await prisma.monitor.create({
		data: {
			title,
			host,
			username,
			password: password ? encrypt(password) : undefined,
			privateKey: privateKey ? encrypt(privateKey) : undefined,
			port,
			type,
		},
	});
	// check monitor as soon as it is added
	monitorMonitor.enqueue(monitor.id);
	return monitor;
}

export function deleteMonitor({ id }: Pick<Monitor, 'id'>) {
	return prisma.monitor.deleteMany({
		where: { id },
	});
}

export function getEnabledMonitors() {
	return prisma.monitor.findMany({
		where: {
			enabled: true,
		},
		select: {
			id: true,
		},
	});
}

export function getMonitors({ type }: Pick<Monitor, 'type'>) {
	return prisma.monitor.findMany({
		where: { type },
		select: {
			id: true,
			title: true,
			host: true,
			caption: true,
			name: true,
			dnsHostName: true,
			domain: true,
			manufacturer: true,
			model: true,
			os: true,
			osVersion: true,
			enabled: true,
			type: true,
			hasError: true,
		},
		orderBy: [
			{
				hasError: 'desc',
			},
			{
				title: 'asc',
			},
		],
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
	| 'missingNotifyTypes'
	| 'missingNotifyResendAfterMinutes'
	| 'percFreeNotify'
	| 'percFreeNotifyTypes'
	| 'percFreeNotifyResendAfterMinutes'
	| 'sizeFreeNotify'
	| 'sizeFreeNotifyTypes'
	| 'sizeFreeNotifyResendAfterMinutes'
	| 'growthRateNotify'
	| 'growthRateNotifyTypes'
	| 'growthRateNotifyResendAfterMinutes'
>) {
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

export function updateMonitor({
	id,
	data,
	drives,
}: Pick<Monitor, 'id'> & {
	data: {
		caption?: string;
		name?: string;
		dnsHostName?: string;
		domain?: string;
		manufacturer?: string;
		model?: string;
		os?: string;
		osVersion?: string;
	};
	drives: {
		data: {
			location?: string;
			name?: string;
			root?: string;
			description?: string;
			size: string;
		};
		used?: string;
		free?: string;
	}[];
}) {
	let lastWeek = new Date();
	lastWeek = new Date(lastWeek.setDate(lastWeek.getDate() - 7));

	return prisma.monitor.update({
		where: { id },
		data: {
			...data,
			hasError: false,
			drives: {
				upsert: drives.map((drive) => {
					return {
						update: {
							...drive.data,
							usage: {
								create: {
									used: drive.used,
									free: drive.free,
								},
							},
						},
						create: {
							...drive.data,
							usage: {
								create: {
									used: drive.used,
									free: drive.free,
								},
							},
						},
						where: {
							monitorId_name: {
								name: drive.data.name,
								monitorId: id,
							},
						},
					};
				}),
			},
		},
		select: {
			drives: {
				select: {
					id: true,
					size: true,
					usage: {
						where: {
							createdAt: {
								gte: lastWeek,
							},
						},
						select: {
							id: true,
							used: true,
							createdAt: true,
						},
						orderBy: {
							createdAt: 'desc',
						},
					},
				},
			},
		},
	});
}

export function setDriveDays({
	id,
	daysTillFull,
}: Pick<Drive, 'id' | 'daysTillFull'>) {
	return prisma.drive.update({
		where: { id },
		data: { daysTillFull },
	});
}

export function setDriveGrowth({
	id,
	growthRate,
}: Pick<Drive, 'id' | 'growthRate'>) {
	return prisma.drive.update({
		where: { id },
		data: { growthRate },
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
