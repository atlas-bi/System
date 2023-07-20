import { decrypt } from '@/lib/utils';
import { NodeSSH } from 'node-ssh';
import { Queue } from 'quirrel/remix';
import {
	getMonitor,
	monitorError,
	monitorLog,
	setDriveDays,
	setDriveGrowth,
	updateMonitor,
} from '~/models/monitor.server';
import Notifier from '~/notifications/notifier';

function disposeSsh(ssh) {
	if (ssh.connection) {
		ssh.getConnection().end();
		ssh.connection.on('error', function () {
			/* No Op */
		});
		ssh.dispose();
	}
}

export default Queue('queues/monitor', async (job: string, meta) => {
	const monitor = await getMonitor({ id: job });
	const { username, host, password, port, privateKey } = monitor;

	try {
		const ssh = new NodeSSH();
		await ssh.connect({
			username,
			host,
			password: password ? decrypt(password) : undefined,
			port,
			privateKey: privateKey ? decrypt(privateKey) : undefined,
		});

		// $body = @{}
		// $body.storage=(gdr -PSProvider 'FileSystem')
		// $body.info=(Get-CIMInstance CIM_ComputerSystem)
		// Invoke-WebRequest `
		// -
		// -Uri http://localhost:3000 -Method POST -Body ($body|ConvertTo-Json) -ContentType application/json

		const storage = await ssh.execCommand(
			'powershell -command "gdr -PSProvider \'FileSystem\'|ConvertTo-Json"',
		);
		const info = await ssh.execCommand(
			'powershell -command "Get-ComputerInfo -property OsName,OsVersion,CsName,CsDNSHostName,CsDomain,CsManufacturer,CsModel|ConvertTo-Json"',
		);

		if (info.code !== 0) {
			throw info;
		}

		const i = JSON.parse(info.stdout);

		if (storage.code !== 0) {
			throw storage;
		}

		const s = JSON.parse(storage.stdout);

		const sum = (
			used: string | null | undefined,
			free: string | null | undefined,
		) => {
			let usedNum = 0;
			let freeNum = 0;
			if (used !== null && used !== undefined && parseInt(used)) {
				usedNum = parseInt(used);
			}
			if (free !== null && free !== undefined && parseInt(free)) {
				freeNum = parseInt(free);
			}

			return (usedNum + freeNum).toString();
		};

		const data = await updateMonitor({
			id: monitor.id,
			data: {
				name: i.CsName,
				dnsHostName: i.CsDNSHostName,
				domain: i.CsDomain,
				manufacturer: i.CsManufacturer,
				model: i.CsModel,
				os: i.OsName,
				osVersion: i.OsVersion,
			},
			drives: s.map(
				(drive: {
					CurrentLocation: any;
					Name: any;
					Root: any;
					Description: any;
					MaximumSize: { toString: () => any };
					Used: string | null | undefined;
					Free: string | null | undefined;
				}) => {
					return {
						data: {
							location: drive.CurrentLocation,
							name: drive.Name,
							root: drive.Root,
							description: drive.Description,
							maximumSize: drive.MaximumSize?.toString(),
							size: sum(drive.Used, drive.Free),
						},
						used: drive.Used?.toString(),
						free: drive.Free?.toString(),
					};
				},
			),
		});

		const oneDay = 24 * 60 * 60 * 1000;
		// calculate days till full
		data.drives?.map(
			async (drive: { size: string; usage: string | any[]; id: any }) => {
				if (!drive.usage || drive.usage.length <= 1) {
					await setDriveDays({ id: drive.id, daysTillFull: undefined });
					await setDriveGrowth({ id: drive.id, growthRate: undefined });
				} else {
					const start = drive.usage[0];
					const end = drive.usage[drive.usage.length - 1];
					const diffDays = Math.max(
						Math.round(Math.abs((start.createdAt - end.createdAt) / oneDay)),
						1,
					);
					const usedGrowth = end.used - start.used;
					const free = Number(drive.size) - end.used;
					const daysTillFull = (
						Math.max(Math.round((free * diffDays) / usedGrowth), -1) || -1
					).toString();
					await setDriveDays({ id: drive.id, daysTillFull });
					await setDriveGrowth({
						id: drive.id,
						growthRate: (usedGrowth / diffDays).toString(),
					});
				}
			},
		);

		disposeSsh(ssh);

		await Notifier({ job });

		console.log(`successfully ran ${job}`);
	} catch (e) {
		console.log(e);
		await monitorLog({
			monitorId: job,
			type: 'error',
			message: JSON.stringify(e),
		});
		await monitorError({ id: job });
		console.log(`${job} monitor failed.`);
	}
});
