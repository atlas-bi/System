import { encrypt } from '@/lib/utils';
import type { Monitor, MonitorFeeds, MonitorLogs, User } from '@prisma/client';
import { prisma } from '~/db.server';
import monitorMonitor from '~/queues/monitor.server';

export type { Monitor, Drive, DriveUsage, MonitorLogs } from '@prisma/client';

export async function deleteMonitor({ id }: Pick<Monitor, 'id'>) {
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

	return prisma.monitor.deleteMany({
		where: { id },
	});
}

export function getMonitorPublic({ id }: Pick<Monitor, 'id'>) {
	return prisma.monitor.findUnique({
		where: { id },
		select: {
			id: true,
			type: true,
			enabled: true,
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
			rebootNotify: true,
			rebootNotifyTypes: {
				select: {
					id: true,
					type: true,
					name: true,
				},
			},
		},
	});
}
export function getMonitor({ id }: Pick<Monitor, 'id'>) {
	return prisma.monitor.findFirst({
		where: { id },
		select: {
			id: true,
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
			rebootNotify: true,
			rebootNotifyTypes: true,
			rebootNotifySentAt: true,
			httpUrl: true,
			httpIgnoreSsl: true,
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
			title: true,
			enabled: true,
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
}: Pick<MonitorLogs, 'monitorId'> & { driveId?: string }) {
	return prisma.monitorLogs.findFirst({
		where: {
			driveId,
			monitorId,
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
			usage: {
				select: {
					id: true,
					free: true,
					used: true,
				},
				take: 1,
			},
		},
		orderBy: [{ enabled: 'desc' }, { size: 'desc' }, { name: 'asc' }],
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
		},
		select: {
			id: true,
			type: true,
		},
	});
	// check monitor as soon as it is added
	monitorMonitor.enqueue(monitor.id);
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
		},
		select: {
			id: true,
			type: true,
		},
	});
	// check monitor as soon as it is added
	monitorMonitor.enqueue(monitor.id);
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
			os: true,
			osVersion: true,
			enabled: true,
			type: true,
			hasError: true,
			feeds: {
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
			},
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

export function updateMonitorNotifications({
	id,
	connectionNotify,
	connectionNotifyTypes,
	connectionNotifyResendAfterMinutes,
	rebootNotify,
	rebootNotifyTypes,
}: Pick<
	Drive,
	| 'id'
	| 'connectionNotify'
	| 'connectionNotifyTypes'
	| 'connectionNotifyResendAfterMinutes'
	| 'rebootNotify'
	| 'rebootNotifyTypes'
>) {
	return prisma.monitor.update({
		where: { id },
		data: {
			connectionNotify,
			connectionNotifyTypes: connectionNotifyTypes
				? { set: connectionNotifyTypes.map((x) => ({ id: x })) }
				: undefined,
			connectionNotifyResendAfterMinutes,

			rebootNotify,
			rebootNotifyTypes: rebootNotifyTypes
				? { set: rebootNotifyTypes.map((x: string) => ({ id: x })) }
				: undefined,
		},
	});
}

export function updateMonitor({
	id,
	data,
	feed,
	drives,
	cpus,
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
		cpuManufacturer?: string;
		cpuModel?: string;
		cpuCores?: string | null;
		cpuProcessors?: string;
		lastBootTime?: string | null | Date;
		cpuMaxSpeed?: string | null;
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
			name?: string;
			root?: string;
			systemDescription?: string;
			size: string;
		};
		used?: string;
		free?: string;
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
