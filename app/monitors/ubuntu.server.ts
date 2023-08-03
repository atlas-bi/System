import {
	Monitor,
	getMonitorDisabledDrives,
	monitorError,
	setDriveDays,
	setDriveGrowth,
	updateMonitor,
} from '~/models/monitor.server';
import Notifier from '~/notifications/notifier';
import { disposeSsh } from './helpers.server';
import { NodeSSH } from 'node-ssh';
import { decrypt } from '@/lib/utils';

async function getStdout(ssh, command) {
	const out = await ssh.execCommand(command);
	if (out.code !== 0) {
		throw { out };
	}
	return out.stdout;
}

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

		const name = await getStdout(ssh, 'cat /etc/hostname');
		const domain = await getStdout(ssh, 'hostname -d');
		// const fullSpecs = await getStdout(ssh, 'sudo dmidecode')
		const manufacturer = await getStdout(
			ssh,
			'dmidecode -s system-manufacturer',
		);
		const model = await getStdout(ssh, 'dmidecode -s system-version');
		const os = await getStdout(ssh, 'lsb_release -ds');
		const osVersion = await getStdout(ssh, 'lsb_release -rs');
		const lastBoot = await getStdout(ssh, 'uptime -s');
		const cpuInfo = JSON.parse(await getStdout(ssh, 'lscpu --json')).lscpu;
		// escape the back slashes!
		const cpuLoad = await getStdout(
			ssh,
			'top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1}\'',
		);
		const memoryTotal = await getStdout(
			ssh,
			'top -bn1 | grep "MiB Mem" | sed "s/.*: *\\([0-9.]*\\).*/\\1/" | awk \'{print $1}\'',
		);
		const memoryUsed = await getStdout(
			ssh,
			'top -bn1 | grep "MiB Mem" | sed "s/.*:.*free, *\\([0-9.]*\\).*/\\1/" | awk \'{print $1}\'',
		);
		const drives = JSON.parse(
			await getStdout(
				ssh,
				'df -P | awk \'BEGIN {printf"{\\"discarray\\":["}{if($1=="Filesystem")next;if(a)printf",";printf"{\\"filesystem\\":\\""$1"\\",\\"mount\\":\\""$6"\\",\\"size\\":\\""$2"\\",\\"used\\":\\""$3"\\",\\"avail\\":\\""$4"\\",\\"use%\\":\\""$5"\\"}";a++;}END{print"]}";}\'',
			),
		);

		// this will be a list of
		// cpu MHz: 1234.1234
		// we should get an average the values.
		const cpuSpeed = await getStdout(ssh, "cat /proc/cpuinfo | grep 'cpu MHz'");
		const average = (arr: number[]) =>
			arr.reduce((p: number, c: number): number => p + c, 0) / arr.length;
		function getCpuMaxSpeed(cpuSpeed: string) {
			const matches = cpuSpeed.matchAll(/^cpu MHz\s*:\s*(\d+(?:.\d+)?)/gms);
			return average([...matches].map((x) => Number(x?.[1] || '0')));
		}

		let lastBootTime = null;

		try {
			lastBootTime = new Date(lastBoot).toString();
		} catch (e) {}

		/*
		nice commands ...

		sudo dmidecode
		lshw -json
		lsblk --json
		lsipc --json
		sfdisk --json
		lscpu --json
		sfdisk -l
		df -h (free disk)
		free -h (ram)
		*/

		const disabledDrives = await getMonitorDisabledDrives({
			monitorId: monitor.id,
		});

		type Drive = {
			filesystem: string;
			mount: string;
			size: string;
			used: string;
			avail: string;
			'use%': string;
		};

		// only update drives that are enabled.
		const updateableDrives = drives.discarray.filter((drive: Drive) => {
			const l =
				disabledDrives.filter(
					(d) => d.name == drive.filesystem && d.root == drive.mount,
				).length == 0;
			return l;
		});

		const data = await updateMonitor({
			id: monitor.id,
			data: {
				name,
				dnsHostName: name,
				domain,
				manufacturer,
				model,
				os,
				osVersion,
				lastBootTime,
				cpuManufacturer:
					cpuInfo.filter(
						(x: { field: string; data: string }) => x.field === 'Vendor ID:',
					)?.[0]?.data || null,
				cpuModel:
					cpuInfo.filter(
						(x: { field: string; data: string }) => x.field === 'Model name:',
					)?.[0]?.data || null,
				cpuCores: null,
				cpuProcessors:
					cpuInfo.filter(
						(x: { field: string; data: string }) => x.field === 'CPU(s):',
					)?.[0]?.data || null,
				cpuMaxSpeed: null,
			},
			feed: {
				// units are in MiB and need to be converted to bytes
				memoryFree: (memoryTotal && memoryUsed
					? (Number(memoryTotal) - Number(memoryUsed)) * 1000000
					: 0
				).toString(),
				memoryTotal: (memoryTotal
					? Number(memoryTotal) * 1000000
					: 0
				).toString(),
				cpuLoad,
				cpuSpeed: getCpuMaxSpeed(cpuSpeed).toString(),
			},
			drives: updateableDrives.map((drive: Drive) => {
				return {
					data: {
						name: drive.filesystem,
						root: drive.mount,
						size: (Number(drive.size) * 1000).toString(),
					},
					used: (Number(drive.used) * 1000).toString(),
					free: (Number(drive.avail) * 1000).toString(),
				};
			}),
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

		await Notifier({ job: monitor.id });

		console.log(`successfully ran ${monitor.id}`);
	} catch (e) {
		console.log(e);
		let message = e.toString();
		try {
			message = JSON.stringify(e);
		} catch (e) {}

		await Notifier({ job: monitor.id, message });

		await monitorError({ id: monitor.id });
		console.log(`${monitor.id} monitor failed.`);
		// try to kill ssh again if there was an error.
		disposeSsh(ssh);
	}
}
