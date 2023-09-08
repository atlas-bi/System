import { encrypt } from '@/lib/utils';
import type {
	Database,
	DatabaseFile,
	Drive,
	Monitor,
	MonitorFeeds,
	MonitorLogs,
	User,
} from '@prisma/client';
import { prisma } from '~/db.server';
import monitorRunner from '~/queues/monitor.server';
import searchLoader from '~/queues/searchService.server';

export type {
	DatabaseFile,
	Database,
	Cpu,
	CpuUsage,
	Monitor,
	Drive,
	DriveUsage,
	MonitorLogs,
	MonitorFeeds,
	DatabaseFileUsage,
} from '@prisma/client';

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

export async function deleteMonitor({ id }: Pick<Monitor, 'id'>) {
	// delete database file usage
	await prisma.databaseFileUsage.deleteMany({
		where: {
			databaseFile: {
				database: {
					monitorId: id,
				},
			},
		},
	});
	// delete database files
	await prisma.databaseFile.deleteMany({
		where: {
			database: {
				monitorId: id,
			},
		},
	});
	// delete database usage
	await prisma.databaseUsage.deleteMany({
		where: {
			database: {
				monitorId: id,
			},
		},
	});
	// delete database
	await prisma.database.deleteMany({
		where: {
			monitorId: id,
		},
	});

	// delete drive usage
	await prisma.driveUsage.deleteMany({
		where: {
			drive: { monitorId: id },
		},
	});

	// delete drive logs
	await prisma.monitorLogs.deleteMany({
		where: {
			drive: { monitorId: id },
		},
	});

	// delete drives
	await prisma.drive.deleteMany({
		where: { monitorId: id },
	});
	// delete logs
	await prisma.monitorLogs.deleteMany({
		where: { monitorId: id },
	});
	// delete feeds
	await prisma.monitorFeeds.deleteMany({
		where: { monitorId: id },
	});

	await prisma.monitor.deleteMany({
		where: { id },
	});

	searchLoader.enqueue(id);
}

export function getMonitorPublic({ id }: Pick<Monitor, 'id'>) {
	return prisma.monitor.findUnique({
		where: { id },
		select: {
			id: true,
			type: true,
			name: true,
			manufacturer: true,
			model: true,
			version: true,
			enabled: true,
			hasError: true,
			host: true,
			password: true,
			username: true,
			port: true,
			privateKey: true,
			os: true,
			osVersion: true,
			title: true,
			lastBootTime: true,
			description: true,
			cpuManufacturer: true,
			cpuModel: true,
			cpuCores: true,
			cpuProcessors: true,
			cpuMaxSpeed: true,
			httpUrl: true,
			httpIgnoreSsl: true,
			httpCheckCert: true,
			httpAcceptedStatusCodes: true,
			httpMaxRedirects: true,
			httpRequestMethod: true,
			httpBodyEncoding: true,
			httpBody: true,
			httpHeaders: true,
			httpAuthentication: true,
			httpUsername: true,
			httpPassword: true,
			httpDomain: true,
			httpWorkstation: true,
			sqlConnectionString: true,
			feeds: {
				select: {
					id: true,
					memoryFree: true,
					memoryTotal: true,
					cpuLoad: true,
					cpuSpeed: true,
					ping: true,
					hasError: true,
				},
				orderBy: {
					createdAt: 'desc',
				},
				take: 1,
			},
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
			description: true,
			os: true,
			osVersion: true,
			title: true,
			connectionNotify: true,
			connectionNotifyTypes: {
				select: {
					id: true,
					type: true,
					name: true,
				},
			},
			connectionNotifyResendAfterMinutes: true,
			connectionNotifySentAt: true,
			connectionNotifyRetries: true,
			connectionNotifyRetried: true,
			httpCheckCert: true,
			httpUrl: true,
			httpCertNotify: true,
			httpCertNotifyTypes: {
				select: {
					id: true,
					type: true,
					name: true,
				},
			},
			httpCertNotifyResendAfterMinutes: true,
			httpCertNotifySentAt: true,
			rebootNotify: true,
			rebootNotifyTypes: {
				select: {
					id: true,
					type: true,
					name: true,
				},
			},
			sqlFileSizePercentFreeNotify: true,
			sqlFileSizePercentFreeNotifyTypes: {
				select: {
					id: true,
					type: true,
					name: true,
				},
			},
			sqlFileSizePercentFreeValue: true,
			sqlFileSizePercentFreeNotifyResendAfterMinutes: true,
		},
	});
}
export function getMonitor({ id }: Pick<Monitor, 'id'>) {
	return prisma.monitor.findFirst({
		where: { id },
		select: {
			id: true,
			name: true,
			type: true,
			title: true,
			description: true,
			enabled: true,
			hasError: true,
			username: true,
			host: true,
			password: true,
			port: true,
			privateKey: true,
			manufacturer: true,
			model: true,
			version: true,
			os: true,
			osVersion: true,

			connectionNotify: true,
			connectionNotifyTypes: {
				select: {
					id: true,
					type: true,
					name: true,
				},
			},
			connectionNotifyResendAfterMinutes: true,
			connectionNotifySentAt: true,
			connectionNotifyRetried: true,
			connectionNotifyRetries: true,

			sqlFileSizePercentFreeNotify: true,
			sqlFileSizePercentFreeNotifyTypes: {
				select: {
					id: true,
					type: true,
					name: true,
				},
			},
			sqlFileSizePercentFreeValue: true,
			sqlFileSizePercentFreeNotifyResendAfterMinutes: true,

			httpCertNotify: true,
			httpCertNotifyTypes: {
				select: {
					id: true,
					type: true,
					name: true,
				},
			},
			httpCertNotifyResendAfterMinutes: true,
			httpCertNotifySentAt: true,
			certDays: true,
			certValid: true,

			rebootNotify: true,
			rebootNotifyTypes: true,
			rebootNotifySentAt: true,

			httpUrl: true,
			httpIgnoreSsl: true,
			httpCheckCert: true,
			httpAcceptedStatusCodes: true,
			httpMaxRedirects: true,
			httpRequestMethod: true,
			httpBodyEncoding: true,
			httpBody: true,
			httpHeaders: true,
			httpAuthentication: true,
			httpUsername: true,
			httpPassword: true,
			httpDomain: true,
			httpWorkstation: true,
			sqlConnectionString: true,
			lastBootTime: true,
			databases: {
				select: {
					id: true,
					title: true,
					name: true,
					enabled: true,
					files: {
						select: {
							id: true,
							enabled: true,
							fileName: true,
							growth: true,
							sqlFileSizePercentFreeNotifySentAt: true,
							usage: {
								select: {
									id: true,
									usedSize: true,
									currentSize: true,
									maxSize: true,
								},
								take: 1,
								orderBy: {
									createdAt: 'desc',
								},
							},
						},
					},
				},
			},
			drives: {
				select: {
					id: true,
					title: true,
					hasError: true,
					enabled: true,
					location: true,
					name: true,
					root: true,
					description: true,
					systemDescription: true,
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
						},
					},
					usage: {
						select: {
							id: true,
							free: true,
							used: true,
						},
						take: 1,
						orderBy: {
							createdAt: 'desc',
						},
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
	databaseId,
	fileId,
	type,
	message,
}: Pick<
	MonitorLogs,
	'monitorId' | 'type' | 'message' | 'driveId' | 'databaseId' | 'fileId'
>) {
	return prisma.monitorLogs.create({
		data: { monitorId, type, message, driveId, databaseId, fileId },
	});
}

export function getDatabaseFile({ id }: Pick<DatabaseFile, 'id'>) {
	return prisma.databaseFile.findUnique({
		where: { id },
		select: {
			id: true,
			fileName: true,
			type: true,
			state: true,
			growth: true,
			isPercentGrowth: true,
			fileId: true,
			filePath: true,
			enabled: true,
			database: {
				select: {
					id: true,
					name: true,
				},
			},
			usage: {
				select: {
					id: true,
					currentSize: true,
					usedSize: true,
					maxSize: true,
				},
				take: 1,
				orderBy: {
					createdAt: 'desc',
				},
			},
		},
	});
}

export function getFileNotifications({ id }: Pick<DatabaseFile, 'id'>) {
	return prisma.databaseFile.findUnique({
		where: { id },
		select: {
			id: true,
			fileName: true,
		},
	});
}

export function getDatabaseNotifications({ id }: Pick<Database, 'id'>) {
	return prisma.database.findUnique({
		where: { id },
		select: {
			id: true,
			title: true,
			enabled: true,
			monitorId: true,
			databaseId: true,
			name: true,
			state: true,
			recoveryModel: true,
			compatLevel: true,
			backupDataDate: true,
			backupDataSize: true,
			backupLogDate: true,
			backupLogSize: true,
			monitor: {
				select: {
					title: true,
					id: true,
					type: true,
					name: true,
				},
			},
			files: {
				select: {
					id: true,
					fileName: true,
					type: true,
					state: true,
					growth: true,
					isPercentGrowth: true,
					fileId: true,
					filePath: true,
					usage: {
						select: {
							id: true,
							currentSize: true,
							usedSize: true,
							maxSize: true,
						},
						take: 1,
						orderBy: {
							createdAt: 'desc',
						},
					},
				},
			},
			usage: {
				select: {
					id: true,
					memory: true,
				},
				take: 1,
				orderBy: {
					createdAt: 'desc',
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
			enabled: true,
			hasError: true,
			monitorId: true,
			location: true,
			name: true,
			root: true,
			systemDescription: true,
			description: true,
			size: true,
			daysTillFull: true,
			growthRate: true,
			missingNotify: true,
			missingNotifyTypes: {
				select: {
					id: true,
					type: true,
					name: true,
				},
			},
			missingNotifyResendAfterMinutes: true,
			percFreeNotify: true,
			percFreeNotifyTypes: {
				select: {
					id: true,
					type: true,
					name: true,
				},
			},
			percFreeNotifyResendAfterMinutes: true,
			percFreeValue: true,
			sizeFreeNotify: true,
			sizeFreeNotifyTypes: {
				select: {
					id: true,
					type: true,
					name: true,
				},
			},
			sizeFreeNotifyResendAfterMinutes: true,
			sizeFreeValue: true,
			growthRateNotify: true,
			growthRateNotifyTypes: {
				select: {
					id: true,
					type: true,
					name: true,
				},
			},
			growthRateNotifyResendAfterMinutes: true,
			growthRateValue: true,
			monitor: {
				select: {
					title: true,
					id: true,
					type: true,
					name: true,
				},
			},
			usage: {
				select: {
					id: true,
					used: true,
					free: true,
				},
				take: 1,
				orderBy: {
					createdAt: 'desc',
				},
			},
		},
	});
}

export function getFileUsage({
	id,
	startDate,
	endDate,
}: Pick<DatabaseFile, 'id'> & { startDate: Date; endDate: Date }) {
	let lastMonth = new Date();
	lastMonth = new Date(lastMonth.setMonth(lastMonth.getMonth() - 1));
	return prisma.databaseFile.findUnique({
		where: { id },
		select: {
			id: true,
			databaseId: true,
			fileName: true,
			enabled: true,
			online: true,
			type: true,
			state: true,
			growth: true,
			isPercentGrowth: true,
			fileId: true,
			filePath: true,
			database: {
				select: {
					name: true,
					id: true,
				},
			},
			usage: {
				select: {
					id: true,
					currentSize: true,
					usedSize: true,
					maxSize: true,
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
						gte: startDate,
						lt: endDate,
					},
				},
				orderBy: { createdAt: 'desc' },
			},
		},
	});
}

export function getDatabaseUsage({
	id,
	startDate,
	endDate,
}: Pick<Database, 'id'> & { startDate: Date; endDate: Date }) {
	let lastMonth = new Date();
	lastMonth = new Date(lastMonth.setMonth(lastMonth.getMonth() - 1));
	return prisma.database.findUnique({
		where: { id },
		select: {
			id: true,
			title: true,
			monitorId: true,
			enabled: true,
			name: true,
			description: true,
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
					memory: true,
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

export function getCpuUsage({
	id,
	startDate,
	endDate,
}: Pick<Monitor, 'id'> & { startDate: Date; endDate: Date }) {
	let lastMonth = new Date();
	lastMonth = new Date(lastMonth.setMonth(lastMonth.getMonth() - 1));
	return prisma.monitor.findUnique({
		where: { id },
		select: {
			id: true,
			title: true,
			type: true,
			feeds: {
				select: {
					id: true,
					cpuLoad: true,
					cpuSpeed: true,
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
			cpus: {
				select: {
					id: true,
					title: true,
					usage: {
						select: {
							id: true,
							load: true,
							speed: true,
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
			},
		},
	});
}

export function getPing({
	id,
	startDate,
	endDate,
}: Pick<Monitor, 'id'> & { startDate: Date; endDate: Date }) {
	let lastMonth = new Date();
	lastMonth = new Date(lastMonth.setMonth(lastMonth.getMonth() - 1));
	return prisma.monitor.findUnique({
		where: { id },
		select: {
			id: true,
			title: true,
			type: true,
			feeds: {
				select: {
					id: true,
					ping: true,
					createdAt: true,
					hasError: true,
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

export function getDatabaseMemoryUsage({
	id,
	startDate,
	endDate,
}: Pick<Monitor, 'id'> & { startDate: Date; endDate: Date }) {
	let lastMonth = new Date();
	lastMonth = new Date(lastMonth.setMonth(lastMonth.getMonth() - 1));
	return prisma.database.findUnique({
		where: { id },
		select: {
			id: true,
			title: true,
			usage: {
				select: {
					id: true,
					memory: true,
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

export function getMemoryUsage({
	id,
	startDate,
	endDate,
}: Pick<Monitor, 'id'> & { startDate: Date; endDate: Date }) {
	let lastMonth = new Date();
	lastMonth = new Date(lastMonth.setMonth(lastMonth.getMonth() - 1));
	return prisma.monitor.findUnique({
		where: { id },
		select: {
			id: true,
			title: true,
			type: true,
			feeds: {
				select: {
					id: true,
					memoryFree: true,
					memoryTotal: true,
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

export function getLatestMonitorLog({
	driveId,
	monitorId,
	databaseId,
	fileId,
}: Pick<MonitorLogs, 'monitorId'> & {
	driveId?: string;
	databaseId?: string;
	fileId?: string;
}) {
	return prisma.monitorLogs.findFirst({
		where: {
			driveId,
			monitorId,
			databaseId,
			fileId,
		},
		orderBy: {
			createdAt: 'desc',
		},
	});
}

export async function getMonitorLogs({
	monitorId,
	driveId,
	databaseId,
	fileId,
	page = 0,
	size = 10,
}: Pick<MonitorLogs, 'monitorId'> & {
	driveId?: string;
	databaseId?: string;
	fileId?: string;
} & {
	page?: number;
	size?: number;
}) {
	const logs = await prisma.$transaction([
		prisma.monitorLogs.count({
			where: {
				monitorId,
				driveId,
				databaseId,
				fileId,
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
				databaseId,
				fileId,
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
				database: {
					select: {
						id: true,
						name: true,
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

export function getMonitorDisabledDatabases({
	monitorId,
}: {
	monitorId: Monitor['id'];
}) {
	return prisma.database.findMany({
		where: { monitorId, enabled: false },
		select: {
			id: true,
			monitorId: true,
			databaseId: true,
		},
	});
}

export function getMonitorDisabledDrives({
	monitorId,
}: {
	monitorId: Monitor['id'];
}) {
	return prisma.drive.findMany({
		where: { monitorId, enabled: false },
		select: {
			id: true,
			monitorId: true,
			location: true,
			name: true,
			root: true,
		},
	});
}

export function getMonitorDatabases({
	monitorId,
}: {
	monitorId: Monitor['id'];
}) {
	return prisma.database.findMany({
		where: { monitorId },
		select: {
			id: true,
			title: true,
			monitorId: true,
			state: true,
			enabled: true,
			name: true,
			databaseId: true,
			description: true,
			recoveryModel: true,
			compatLevel: true,
			backupDataDate: true,
			backupDataSize: true,
			backupLogDate: true,
			backupLogSize: true,
			monitor: {
				select: {
					id: true,
					type: true,
				},
			},
			usage: {
				select: {
					id: true,
					memory: true,
				},
				take: 1,
				orderBy: {
					createdAt: 'desc',
				},
			},
		},
		orderBy: [{ enabled: 'desc' }, { name: 'asc' }],
	});
}

export function getMonitorDrives({ monitorId }: { monitorId: Monitor['id'] }) {
	return prisma.drive.findMany({
		where: { monitorId },
		select: {
			id: true,
			title: true,
			monitorId: true,
			location: true,
			enabled: true,
			name: true,
			root: true,
			description: true,
			systemDescription: true,
			size: true,
			daysTillFull: true,
			growthRate: true,
			online: true,
			usage: {
				select: {
					id: true,
					free: true,
					used: true,
				},
				take: 1,
				orderBy: {
					createdAt: 'desc',
				},
			},
		},
		orderBy: [
			{ online: 'desc' },
			{ enabled: 'desc' },
			{ size: 'desc' },
			{ name: 'asc' },
		],
	});
}
export function getDriveMonitor({ id }: { id: Drive['id'] }) {
	return prisma.drive.findUnique({
		where: { id },
		select: {
			monitor: { select: { id: true, type: true } },
		},
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
	description,
	enabled,
	httpUrl,
	httpIgnoreSsl,
	httpCheckCert,
	httpAcceptedStatusCodes,
	httpMaxRedirects,
	httpRequestMethod,
	httpBodyEncoding,
	httpBody,
	httpHeaders,
	httpAuthentication,
	httpUsername,
	httpPassword,
	httpDomain,
	httpWorkstation,
	sqlConnectionString,
}: Pick<
	Monitor,
	| 'title'
	| 'port'
	| 'privateKey'
	| 'username'
	| 'password'
	| 'host'
	| 'type'
	| 'description'
	| 'enabled'
	| 'httpUrl'
	| 'httpIgnoreSsl'
	| 'httpCheckCert'
	| 'httpAcceptedStatusCodes'
	| 'httpMaxRedirects'
	| 'httpRequestMethod'
	| 'httpBodyEncoding'
	| 'httpBody'
	| 'httpHeaders'
	| 'httpAuthentication'
	| 'httpUsername'
	| 'httpPassword'
	| 'httpDomain'
	| 'httpWorkstation'
	| 'sqlConnectionString'
>) {
	const monitor = await prisma.monitor.create({
		data: {
			title,
			host,
			username,
			password: password ? encrypt(password) : null,
			privateKey: privateKey ? encrypt(privateKey) : null,
			port,
			type,
			description,
			enabled,
			httpUrl,
			httpIgnoreSsl,
			httpCheckCert,
			httpAcceptedStatusCodes,
			httpMaxRedirects,
			httpRequestMethod,
			httpBodyEncoding,
			httpBody,
			httpHeaders,
			httpAuthentication,
			httpUsername,
			httpPassword: httpPassword ? encrypt(httpPassword) : null,
			httpDomain,
			httpWorkstation,
			sqlConnectionString: sqlConnectionString
				? encrypt(sqlConnectionString)
				: null,
		},
		select: {
			id: true,
			type: true,
		},
	});

	if (enabled) {
		// check monitor as soon as it is added
		monitorRunner.enqueue(monitor.id);
	}
	searchLoader.enqueue(monitor.id);

	return monitor;
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

export function editDatabase({
	id,
	title,
	description,
	enabled,
}: Pick<Database, 'id' | 'title' | 'description' | 'enabled'>) {
	return prisma.database.update({
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

export function editFile({
	id,

	enabled,
}: Pick<DatabaseFile, 'id' | 'enabled'>) {
	return prisma.databaseFile.update({
		where: { id },
		data: {
			enabled,
		},
		select: {
			id: true,
		},
	});
}

export async function editMonitor({
	id,
	title,
	host,
	username,
	password,
	privateKey,
	port,
	type,
	description,
	enabled,
	httpUrl,
	httpIgnoreSsl,
	httpCheckCert,
	httpAcceptedStatusCodes,
	httpMaxRedirects,
	httpRequestMethod,
	httpBodyEncoding,
	httpBody,
	httpHeaders,
	httpAuthentication,
	httpUsername,
	httpPassword,
	httpDomain,
	httpWorkstation,
	sqlConnectionString,
}: Pick<
	Monitor,
	| 'id'
	| 'title'
	| 'port'
	| 'privateKey'
	| 'username'
	| 'password'
	| 'host'
	| 'type'
	| 'description'
	| 'enabled'
	| 'httpUrl'
	| 'httpIgnoreSsl'
	| 'httpCheckCert'
	| 'httpAcceptedStatusCodes'
	| 'httpMaxRedirects'
	| 'httpRequestMethod'
	| 'httpBodyEncoding'
	| 'httpBody'
	| 'httpHeaders'
	| 'httpAuthentication'
	| 'httpUsername'
	| 'httpPassword'
	| 'httpDomain'
	| 'httpWorkstation'
	| 'sqlConnectionString'
>) {
	const monitor = await prisma.monitor.update({
		where: { id },
		data: {
			title,
			host,
			username,
			password: password ? encrypt(password) : null,
			privateKey: privateKey ? encrypt(privateKey) : null,
			port,
			type,
			description,
			enabled,
			httpUrl,
			httpIgnoreSsl,
			httpCheckCert,
			httpAcceptedStatusCodes,
			httpMaxRedirects,
			httpRequestMethod,
			httpBodyEncoding,
			httpBody,
			httpHeaders,
			httpAuthentication,
			httpUsername,
			httpPassword: httpPassword ? encrypt(httpPassword) : null,
			httpDomain,
			httpWorkstation,
			sqlConnectionString: sqlConnectionString
				? encrypt(sqlConnectionString)
				: null,
		},
		select: {
			id: true,
			type: true,
		},
	});
	if (enabled) {
		// check monitor as soon as it is added
		monitorRunner.enqueue(monitor.id);
	}
	searchLoader.enqueue(monitor.id);
	return monitor;
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

export function getDatabaseLatestFeeds({ id }: Pick<Database, 'id'>) {
	return prisma.databaseUsage.findMany({
		where: { databaseId: id },
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

export function getMonitorLatestFeeds({ id }: Pick<Monitor, 'id'>) {
	return prisma.monitorFeeds.findMany({
		where: { monitorId: id },
		select: {
			id: true,
			ping: true,
			hasError: true,
			createdAt: true,
			message: true,
		},
		take: 30,
		orderBy: {
			createdAt: 'desc',
		},
	});
}

export function getMonitors({ type }: Pick<Monitor, 'type'>) {
	return prisma.monitor.findMany({
		where: { type },
		select: {
			id: true,
			title: true,
			description: true,
			host: true,
			caption: true,
			name: true,
			dnsHostName: true,
			domain: true,
			manufacturer: true,
			model: true,
			version: true,
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

export function updateMonitorNotifications({
	id,
	connectionNotify,
	connectionNotifyTypes,
	connectionNotifyResendAfterMinutes,
	connectionNotifyRetries,
	rebootNotify,
	rebootNotifyTypes,
	httpCertNotify,
	httpCertNotifyTypes,
	httpCertNotifyResendAfterMinutes,
	sqlFileSizePercentFreeNotify,
	sqlFileSizePercentFreeNotifyTypes,
	sqlFileSizePercentFreeNotifyResendAfterMinutes,
	sqlFileSizePercentFreeValue,
}: Pick<
	Monitor,
	| 'id'
	| 'connectionNotify'
	| 'connectionNotifyResendAfterMinutes'
	| 'rebootNotify'
	| 'connectionNotifyRetries'
	| 'httpCertNotify'
	| 'httpCertNotifyResendAfterMinutes'
	| 'sqlFileSizePercentFreeNotify'
	| 'sqlFileSizePercentFreeNotifyResendAfterMinutes'
	| 'sqlFileSizePercentFreeValue'
> & {
	sqlFileSizePercentFreeNotifyTypes: string[];
	httpCertNotifyTypes: string[];
	connectionNotifyTypes: string[];
	rebootNotifyTypes: string[];
}) {
	return prisma.monitor.update({
		where: { id },
		data: {
			connectionNotify,
			connectionNotifyTypes: connectionNotifyTypes
				? { set: connectionNotifyTypes.map((x) => ({ id: x })) }
				: undefined,
			connectionNotifyResendAfterMinutes,
			connectionNotifyRetries,
			rebootNotify,
			rebootNotifyTypes: rebootNotifyTypes
				? { set: rebootNotifyTypes.map((x: string) => ({ id: x })) }
				: undefined,
			httpCertNotify,
			httpCertNotifyTypes: httpCertNotifyTypes
				? { set: httpCertNotifyTypes.map((x) => ({ id: x })) }
				: undefined,
			httpCertNotifyResendAfterMinutes,
			sqlFileSizePercentFreeNotify,
			sqlFileSizePercentFreeNotifyTypes: sqlFileSizePercentFreeNotifyTypes
				? { set: sqlFileSizePercentFreeNotifyTypes.map((x) => ({ id: x })) }
				: undefined,
			sqlFileSizePercentFreeNotifyResendAfterMinutes,
			sqlFileSizePercentFreeValue,
		},
	});
}

export function updateMonitor({
	id,
	data,
	feed,
	drives,
	databases,
	cpus,
}: Pick<Monitor, 'id'> & {
	data?: {
		caption?: string;
		name?: string;
		dnsHostName?: string;
		domain?: string;
		manufacturer?: string;
		model?: string;
		version?: string;
		os?: string;
		osVersion?: string;
		cpuManufacturer?: string;
		cpuModel?: string;
		cpuCores?: string | null;
		cpuProcessors?: string;
		lastBootTime?: string | null | Date;
		cpuMaxSpeed?: string | null;
		certDays?: string;
		certValid?: boolean;
	};
	feed?: {
		memoryFree?: string;
		memoryTotal?: string;
		cpuLoad?: string;
		cpuSpeed?: string;
		ping?: string;
	};
	drives?: {
		data: {
			location?: string;
			name: string;
			root?: string;
			systemDescription?: string;
			size: string;
		};
		used?: string;
		free?: string;
	}[];
	databases?: {
		data: {
			databaseId: string;
			name: string;
			stateDesc?: string;
			recoveryModel?: string;
			backupDataDate?: string;
			backupDataSize?: string;
			backupLogDate?: string;
			backupLogSize?: string;
			compatLevel?: string;
		};
		memory?: string;
		files?: {
			data: {
				sqlDatabaseId: string;
				fileName?: string;
				type?: string;
				state?: string;
				growth?: string;
				isPercentGrowth?: string;
				fileId: string;
				filePath?: string;
			};
			usedSize?: string;
			currentSize?: string;
			maxSize?: string;
		}[];
	}[];
	cpus?: {
		name: string;
		used: string;
		speed?: string;
	}[];
}) {
	let lastWeek = new Date();
	lastWeek = new Date(lastWeek.setDate(lastWeek.getDate() - 7));

	return prisma.monitor.update({
		where: { id },
		data: {
			...data,
			hasError: false,
			feeds: feed
				? {
						create: {
							memoryFree: feed.memoryFree,
							memoryTotal: feed.memoryTotal,
							cpuLoad: feed.cpuLoad,
							cpuSpeed: feed.cpuSpeed,
							ping: feed.ping,
						},
				  }
				: undefined,
			drives: drives
				? {
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
				  }
				: undefined,
			databases: databases
				? {
						upsert: databases.map((database) => {
							return {
								update: {
									...database.data,
									files: database.files
										? {
												upsert: database.files.map((file) => {
													return {
														update: {
															...file.data,
															monitorId: id,
															usage: {
																create: {
																	usedSize: file.usedSize,
																	currentSize: file.currentSize,
																	maxSize: file.maxSize,
																},
															},
														},
														create: {
															...file.data,
															monitorId: id,
															usage: {
																create: {
																	usedSize: file.usedSize,
																	currentSize: file.currentSize,
																	maxSize: file.maxSize,
																},
															},
														},
														where: {
															monitorId_sqlDatabaseId_fileId: {
																sqlDatabaseId: file.data.sqlDatabaseId,
																fileId: file.data.fileId,
																monitorId: id,
															},
														},
													};
												}),
										  }
										: undefined,
									usage: {
										create: {
											memory: database.memory,
										},
									},
								},
								create: {
									...database.data,
									files: database.files
										? {
												create: database.files.map((file) => {
													return {
														...file.data,
														monitorId: id,
														usage: {
															create: {
																usedSize: file.usedSize,
																currentSize: file.currentSize,
																maxSize: file.maxSize,
															},
														},
													};
												}),
										  }
										: undefined,
									usage: {
										create: {
											memory: database.memory,
										},
									},
								},
								where: {
									monitorId_databaseId: {
										databaseId: database.data.databaseId,
										monitorId: id,
									},
								},
							};
						}),
				  }
				: undefined,
			cpus: cpus
				? {
						upsert: cpus.map((cpu) => {
							return {
								update: {
									title: cpu.name,
									usage: {
										create: {
											load: cpu.used,
											speed: cpu.speed ? cpu.speed : undefined,
										},
									},
								},
								create: {
									title: cpu.name,
									usage: {
										create: {
											load: cpu.used,
											speed: cpu.speed ? cpu.speed : undefined,
										},
									},
								},
								where: {
									monitorId_title: {
										title: cpu.name,
										monitorId: id,
									},
								},
							};
						}),
				  }
				: undefined,
		},
		select: {
			drives: {
				select: {
					id: true,
					size: true,
					name: true,
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
			feeds: {
				select: { id: true },
				orderBy: {
					createdAt: 'desc',
				},
				take: 1,
			},
			databases: {
				select: {
					id: true,
					files: {
						select: {
							id: true,
							usage: {
								where: {
									createdAt: {
										gte: lastWeek,
									},
								},
								select: {
									id: true,
									maxSize: true,
									currentSize: true,
									usedSize: true,
									createdAt: true,
								},
								orderBy: {
									createdAt: 'desc',
								},
							},
						},
					},
				},
			},
		},
	});
}

export function setFileDays({
	id,
	daysTillFull,
}: Pick<DatabaseFile, 'id' | 'daysTillFull'>) {
	return prisma.databaseFile.update({
		where: { id },
		data: { daysTillFull },
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

export function setDriveOnline({ id, online }: Pick<Drive, 'id' | 'online'>) {
	return prisma.drive.update({
		where: { id },
		data: { online },
	});
}

export function setFileGrowth({
	id,
	growthRate,
}: Pick<DatabaseFile, 'id' | 'growthRate'>) {
	return prisma.databaseFile.update({
		where: { id },
		data: { growthRate },
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

export function setFilePercFreeSentAt({
	id,
	sqlFileSizePercentFreeNotifySentAt,
}: Pick<DatabaseFile, 'id' | 'sqlFileSizePercentFreeNotifySentAt'>) {
	return prisma.databaseFile.update({
		where: { id },
		data: { sqlFileSizePercentFreeNotifySentAt },
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

export function setMonitorConnectionRetried({
	id,
	connectionNotifyRetried,
}: Pick<Monitor, 'id' | 'connectionNotifyRetried'>) {
	return prisma.monitor.update({
		where: { id },
		data: { connectionNotifyRetried },
	});
}

export function setMonitorConnectionSentAt({
	id,
	connectionNotifySentAt,
}: Pick<Monitor, 'id' | 'connectionNotifySentAt'>) {
	return prisma.monitor.update({
		where: { id },
		data: { connectionNotifySentAt },
	});
}

export function setMonitorRebootSentAt({
	id,
	rebootNotifySentAt,
}: Pick<Monitor, 'id' | 'rebootNotifySentAt'>) {
	return prisma.monitor.update({
		where: { id },
		data: { rebootNotifySentAt },
	});
}

export function setMonitorHttpCertSentAt({
	id,
	httpCertNotifySentAt,
}: Pick<Monitor, 'id' | 'httpCertNotifySentAt'>) {
	return prisma.monitor.update({
		where: { id },
		data: { httpCertNotifySentAt },
	});
}

export function setFeedError({
	id,
	message,
	hasError,
}: Pick<MonitorFeeds, 'id' | 'hasError' | 'message'>) {
	return prisma.monitorFeeds.update({
		where: { id },
		data: { hasError, message },
	});
}

export function getMonitorBootTime({ id }: Pick<Monitor, 'id'>) {
	return prisma.monitor.findUnique({
		where: { id },
		select: {
			id: true,
			lastBootTime: true,
		},
	});
}
