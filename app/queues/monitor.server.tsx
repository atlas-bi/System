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

	const ssh = new NodeSSH();
	try {
		await ssh.connect({
			username,
			host,
			password: password ? decrypt(password) : undefined,
			port,
			privateKey: privateKey ? decrypt(privateKey) : undefined,
		});

		let pwshVersionCheck = await ssh.execCommand(
			'powershell -command "Get-Host | Select-Object Version|ConvertTo-Json"',
		);

		let pwshCommand = 'powershell';

		let pwshVersion = JSON.parse(pwshVersionCheck.stdout);

		if (pwshVersion?.Version?.Major < 5) {
			pwshVersionCheck = await ssh.execCommand(
				'pwsh -command "Get-Host | Select-Object Version|ConvertTo-Json"',
			);

			let pwshVersion = JSON.parse(pwshVersionCheck.stdout);
			if (pwshVersion?.Version?.Major > 4) {
				pwshCommand = 'pwsh';
			}
		}

		// $body = @{}
		// $body.storage=(gdr -PSProvider 'FileSystem')
		// $body.info=(Get-CIMInstance CIM_ComputerSystem)
		// Invoke-WebRequest `
		// -
		// -Uri http://localhost:3000 -Method POST -Body ($body|ConvertTo-Json) -ContentType application/json

		const storage = await ssh.execCommand(
			`${pwshCommand} -command "gdr -PSProvider \'FileSystem\'|ConvertTo-Json"`,
		);

		const osRaw = await ssh.execCommand(
			`${pwshCommand} -command "Get-CIMInstance win32_operatingsystem | Select-Object Caption,Version,LastBootUpTime | ConvertTo-Json"`,
		);

		const csRaw = await ssh.execCommand(
			`${pwshCommand} -command "Get-CIMInstance win32_computersystem | Select-Object Name,DNSHostName,Domain,Manufacturer,Model | ConvertTo-Json"`,
		);

		if (csRaw.code !== 0) {
			throw { host, pwshCommand, csRaw };
		}

		if (osRaw.code !== 0) {
			throw osRaw;
		}

		const cs = JSON.parse(
			csRaw.stdout.replace(
				'WARNING: Resulting JSON is truncated as serialization has exceeded the set depth of 2.\r\n',
				'',
			),
		);
		const os = JSON.parse(
			osRaw.stdout.replace(
				'WARNING: Resulting JSON is truncated as serialization has exceeded the set depth of 2.\r\n',
				'',
			),
		);

		if (storage.code !== 0) {
			throw storage;
		}

		const s = JSON.parse(
			storage.stdout.replace(
				'WARNING: Resulting JSON is truncated as serialization has exceeded the set depth of 2.\r\n',
				'',
			),
		);

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

		let lastBoot = null;

		// dates come in two formats depending on ps version.
		// /Date(1689124841494)/
		// 2023-01-22T00:23:47.493832-06:00
		if (/Date.+?/.test(os.LastBootUpTime)) {
			const stripedString = Number(
				os.LastBootUpTime.replace('/Date(', '').replace(')/', ''),
			);
			lastBoot = new Date(stripedString);
		} else {
			lastBoot = new Date(os.LastBootUpTime);
		}

		const data = await updateMonitor({
			id: monitor.id,
			data: {
				name: cs.Name,
				dnsHostName: cs.DNSHostName,
				domain: cs.Domain,
				manufacturer: cs.Manufacturer,
				model: cs.Model,
				os: os.Caption,
				osVersion: os.Version,
				lastBootTime: lastBoot,
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
					await setDriveDays({ id: drive.id, daysTillFull: null });
					await setDriveGrowth({ id: drive.id, growthRate: null });
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
		await Notifier({ job, message: JSON.stringify(e) });

		await monitorError({ id: job });
		console.log(`${job} monitor failed.`);
		// try to kill ssh again if there was an error.
		disposeSsh(ssh);
	}
});
