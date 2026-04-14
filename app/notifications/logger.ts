import { getLatestMonitorLog, monitorLog } from "~/models/monitor.server";

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
	monitor: { id: string };
	drive?: { id: string };
	database?: { id: string };
	file?: { id: string };
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
