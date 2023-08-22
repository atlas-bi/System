import {
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
}: {
	message: string;
	type: string;
	monitor: Monitor;
	drive?: Drive;
}) {
	const lastLog = await getLatestMonitorLog({
		monitorId: monitor.id,
		driveId: drive?.id,
	});

	if (message !== lastLog?.message) {
		await monitorLog({
			driveId: drive?.id || null,
			monitorId: monitor.id,
			type,
			message,
		});
	}
}
