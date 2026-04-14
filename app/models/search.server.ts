import { prisma } from '~/db.server';

export async function getSearchData() {
	const monitors = await prisma.monitor.findMany({
		select: {
			id: true,
			type: true,
			title: true,
			name: true,
			manufacturer: true,
			model: true,
			version: true,
			enabled: true,
			hasError: true,
			host: true,
			username: true,
			os: true,
			osVersion: true,
			description: true,
			cpuManufacturer: true,
			cpuModel: true,
			httpUrl: true,
			httpBody: true,
			httpHeaders: true,
			httpUsername: true,
			httpDomain: true,
			httpWorkstation: true,
		},
	});

	const drives = await prisma.drive.findMany({
		select: {
			id: true,
			title: true,
			enabled: true,
			hasError: true,
			location: true,
			name: true,
			root: true,
			systemDescription: true,
			description: true,
			monitor: {
				select: {
					id: true,
					type: true,
					name: true,
					title: true,
				},
			},
		},
	});

	const databases = await prisma.database.findMany({
		select: {
			id: true,
			title: true,
			enabled: true,
			name: true,
			description: true,
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

	const files = await prisma.databaseFile.findMany({
		select: {
			id: true,
			fileName: true,
			type: true,
			state: true,
			filePath: true,
			enabled: true,
			database: {
				select: {
					id: true,
					name: true,
					title: true,
					monitor: {
						select: {
							id: true,
							name: true,
							type: true,
							title: true,
						},
					},
				},
			},
		},
	});

	return [
		...monitors.map((x) => ({
			id: `${x.type}-${x.id}`,
			url: `/${x.type}/${x.id}`,
			name: x.name,
			title: x.title,
			tags: [x.type],
			enabled: x.enabled,
			hasError: x.hasError,
			description: x.description,
			httpUrl: x.httpUrl,
			meta: [
				x.manufacturer,
				x.model,
				x.version,
				x.host,
				x.username,
				x.os,
				x.osVersion,
				x.description,
				x.cpuManufacturer,
				x.cpuModel,
				x.httpUrl,
				x.httpBody,
				x.httpHeaders,
				x.httpUsername,
				x.httpDomain,
				x.httpWorkstation,
			],
		})),
		...drives.map((x) => ({
			id: `${x.monitor.type}-${x.monitor.id}-drive-${x.id}`,
			url: `/${x.monitor.type}/${x.monitor.id}/drive/${x.id}`,
			title: (x.root ? x.root + ' ' : '') + (x.monitor.name || x.monitor.title),
			name: x.name,
			tags: ['drive'],
			enabled: x.enabled,
			hasError: x.hasError,
			description: x.description,
			meta: [x.systemDescription, x.location, x.root],
		})),
		...databases.map((x) => ({
			id: `${x.monitor.type}-${x.monitor.id}-database-${x.id}`,
			url: `/${x.monitor.type}/${x.monitor.id}/database/${x.id}`,
			name: x.name,
			title:
				(x.title ? x.title + ' ' : '') + (x.monitor.name || x.monitor.title),
			tags: ['database'],
			enabled: x.enabled,
			hasError: false,
			description: x.description,
		})),
		...files.map((x) => ({
			id: `${x.database.monitor.type}-${x.database.monitor.id}-database-${x.database.id}-file-${x.id}`,
			url: `/${x.database.monitor.type}/${x.database.monitor.id}/database/${x.database.id}/file/${x.id}`,
			name: x.fileName,
			title:
				(x.database.name || x.database.title) +
				' ' +
				(x.database.monitor.name || x.database.monitor.title),
			tags: ['file'],
			enabled: x.enabled,
			meta: [x.filePath],
		})),
	];
}
