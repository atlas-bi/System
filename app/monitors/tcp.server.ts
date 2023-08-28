import { Monitor, monitorError, updateMonitor } from '~/models/monitor.server';

import Notifier from '~/notifications/notifier';
import tcpp from 'tcp-ping';
import util from 'node:util';
const tcpping = util.promisify(tcpp.ping);

export async function TcpCheck({
	address,
	port,
}: {
	address: string;
	port: number;
}) {
	return tcpping({ address, port, attempts: 1 });
}

export default async function TcpMonitor({ monitor }: { monitor: Monitor }) {
	// most thanks to https://github.com/louislam/uptime-kuma/blob/de8386362710973d00b8bbc41374753d3500219c/server/model/monitor.js#L1015

	const { host, port } = monitor;

	let startTime = Date.now();

	try {
		await TcpCheck({
			address: host,
			port,
		});

		const ping = Date.now() - startTime;

		await updateMonitor({
			id: monitor.id,
			feed: {
				ping: ping.toString(),
			},
		});

		await Notifier({ job: monitor.id });

		console.log(`successfully ran ${monitor.type} monitor: ${monitor.id}`);
	} catch (e) {
		console.log(e);
		let message = e.toString();
		try {
			message = JSON.stringify(e);
			// don't return nothing
			if (message === '{}') {
				message = e.toString();
			}
		} catch (e) {}

		await Notifier({ job: monitor.id, message });
		await monitorError({ id: monitor.id });
		console.log(`${monitor.type} monitor ${monitor.id} failed.`);
	}
}
