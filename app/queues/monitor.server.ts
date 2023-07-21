import { Queue } from 'quirrel/remix';
import { getMonitor } from '~/models/monitor.server';
import WindowsMonitor from '~/monitors/windows.server';

export default Queue('queues/monitor', async (job: string, meta) => {
	const monitor = await getMonitor({ id: job });

	if (!monitor) {
		return;
	}

	if (monitor.type == 'windows') {
		await WindowsMonitor({ monitor });
	}
});
