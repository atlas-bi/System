import { Queue } from 'quirrel/remix';
import { getMonitor } from '~/models/monitor.server';
import WindowsMonitor from '~/monitors/windows.server';
import UbuntuMonitor from '~/monitors/ubuntu.server';
import HttpMonitor from '~/monitors/http.server';
import SqlServerMonitor from '~/monitors/sqlServer.server';
import TcpMonitor from '~/monitors/tcp.server';

export default Queue('queues/monitor', async (job: string, meta) => {
	const monitor = await getMonitor({ id: job });

	if (!monitor) {
		return;
	}
	if (monitor.type == 'windows') {
		return WindowsMonitor({ monitor });
	}
	if (monitor.type == 'ubuntu') {
		return UbuntuMonitor({ monitor });
	}
	if (monitor.type == 'http') {
		return HttpMonitor({ monitor });
	}
	if (monitor.type == 'sqlServer') {
		return SqlServerMonitor({ monitor });
	}
	if (monitor.type == 'tcp') {
		return TcpMonitor({ monitor });
	}
});
