import {
	Database,
	DatabaseFile,
	Drive,
	Monitor,
	getLatestMonitorLog,
	monitorLog,
} from '~/models/monitor.server';

export async function Logger({
	message,
	type,
	monitor,
	drive,
	database,
	file,
}: {
	message: string;
	type: string;
	monitor: Monitor;
	drive?: Drive;
	database?: Database;
	file?: DatabaseFile;
}) {
	const lastLog = await getLatestMonitorLog({
		monitorId: monitor.id,
		driveId: drive?.id,
		databaseId: database?.id,
		fileId: file?.id,
	});

	if (message !== lastLog?.message) {
		await monitorLog({
			driveId: drive?.id || null,
			databaseId: database?.id || null,
			fileId: file?.id || null,
			monitorId: monitor.id,
			type,
			message,
		});
	}
}
