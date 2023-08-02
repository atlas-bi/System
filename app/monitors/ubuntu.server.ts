import { Monitor, monitorError } from '~/models/monitor.server';
import Notifier from '~/notifications/notifier';
import { disposeSsh } from './helpers.server';
import { NodeSSH } from 'node-ssh';
import { decrypt } from '@/lib/utils';

export default async function UbuntuMonitor({ monitor }: { monitor: Monitor }) {
	const { username, host, password, port, privateKey } = monitor;

	const ssh = new NodeSSH();
	try {
		await ssh.connect({
			username,
			host,
			password: password ? decrypt(password) : undefined,
			port: Number(port),
			privateKey: privateKey ? decrypt(privateKey) : undefined,
		});

		let system = await ssh.execCommand('sudo lshw -json');
		console.log(JSON.parse(system.stdout).children[0].children[0]);

		/*
		lshw -json
		lsblk --json
		lsipc --json
		sfdisk --json

		df -h (free disk)
		free -h (ram)

		*/
		// cpu: children[id:core][id:cpu:?]
		// name: id
		/*
		product
		vnedor
		version*/

		disposeSsh(ssh);

		await Notifier({ job: monitor.id });

		console.log(`successfully ran ${monitor.id}`);
	} catch (e) {
		console.log(e);
		await Notifier({ job: monitor.id, message: e.toString() });

		await monitorError({ id: monitor.id });
		console.log(`${monitor.id} monitor failed.`);
		// try to kill ssh again if there was an error.
		disposeSsh(ssh);
	}
}
