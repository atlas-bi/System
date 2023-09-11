import {
	Monitor,
	getMonitor,
	getMonitorDisabledDrives,
	monitorError,
	updateMonitor,
} from '~/models/monitor.server';

import { setDriveOnline } from '~/models/drive.server';
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
		const manufacturer = await getStdout(
			ssh,
			'cat /sys/devices/virtual/dmi/id/sys_vendor',
		);
		const model = await getStdout(
			ssh,
			'cat /sys/devices/virtual/dmi/id/product_version',
		);
		const os = await getStdout(ssh, 'lsb_release -ds');
		const osVersion = await getStdout(ssh, 'lsb_release -rs');
		const lastBoot = await getStdout(ssh, 'uptime -s');
		const cpuInfo = JSON.parse(await getStdout(ssh, 'lscpu --json')).lscpu;
		// escape the back slashes!
		const cpuLoad = await getStdout(
			ssh,
			'top -bn1 -w512 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1}\'',
		);
		const allCpuLoad = await getStdout(
			ssh,
			'top -bn1 -1 -w512 | grep \'%Cpu\' | sed "s/.\\(%Cpu[0-9]*.*\\)/\\n\\1/" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1}\'',
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
			lastBootTime = new Date(lastBoot).toISOString();
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

		// only update drives that are enabled and not tmpfs
		const updateableDrives = drives.discarray.filter((drive: Drive) => {
			const l =
				disabledDrives.filter(
					(d) => d.name == drive.filesystem && d.root == drive.mount,
				).length == 0 && drive.filesystem !== 'tmpfs';

			return l;
		});
		const oldMonitor = await getMonitor({ id: monitor.id });
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
						root: drive.filesystem,
						name: drive.mount,
						size: (Number(drive.size) * 1000).toString(),
					},
					used: (Number(drive.used) * 1000).toString(),
					free: (Number(drive.avail) * 1000).toString(),
				};
			}),
			cpus: allCpuLoad
				.split(/\r?\n/)
				.map((x: string, i: number) => ({ name: i.toString(), used: x })),
		});

		// online/offline
		data.drives?.map(
			async (drive: {
				size: string;
				usage: string | any[];
				id: any;
				name: string;
			}) => {
				await setDriveOnline({
					id: drive.id,
					online:
						updateableDrives.filter(
							(x: { mount: string }) => x.mount == drive.name,
						).length > 0,
				});
			},
		);

		disposeSsh(ssh);

		await Notifier({ job: monitor.id, oldMonitor });

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
		// try to kill ssh again if there was an error.
		disposeSsh(ssh);
	}
}
