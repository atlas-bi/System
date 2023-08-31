import { AxiosResponse } from 'axios';
import { differenceInDays } from 'date-fns';
import { NodeSSH } from 'node-ssh';

export function disposeSsh(ssh: NodeSSH) {
	if (ssh.connection) {
		// @ts-ignore
		ssh.getConnection().end();
		ssh.connection.on('error', function () {
			/* No Op */
		});
		ssh.dispose();
	}
}

//https://github.com/louislam/uptime-kuma/blob/master/server/util-server.js#L640
const parseCertificateInfo = function (info) {
	let link = info;
	let i = 0;

	const existingList = {};

	while (link) {
		// console.log("cert", `[${i}] ${link.fingerprint}`);

		if (!link.valid_from || !link.valid_to) {
			break;
		}
		link.validTo = new Date(link.valid_to);
		link.validFor = link.subjectaltname
			?.replace(/DNS:|IP Address:/g, '')
			.split(', ');
		link.daysRemaining = differenceInDays(link.validTo, new Date());

		// @ts-ignore
		existingList[link.fingerprint] = true;

		// Move up the chain until loop is encountered
		if (link.issuerCertificate == null) {
			link.certType = i === 0 ? 'self-signed' : 'root CA';
			break;
		} else if (link.issuerCertificate.fingerprint in existingList) {
			// a root CA certificate is typically "signed by itself"  (=> "self signed certificate") and thus the "issuerCertificate" is a reference to itself.
			// console.log("cert", `[Last] ${link.issuerCertificate.fingerprint}`);
			link.certType = i === 0 ? 'self-signed' : 'root CA';
			link.issuerCertificate = null;
			break;
		} else {
			link.certType = i === 0 ? 'server' : 'intermediate CA';
			link = link.issuerCertificate;
		}

		// Should be no use, but just in case.
		if (i > 500) {
			throw new Error('Dead loop occurred in parseCertificateInfo');
		}
		i++;
	}

	return info;
};
export const checkCertificate = function (res: AxiosResponse<any, any>) {
	if (!res?.request?.res?.socket && !res?.request?.res?.req?.socket) {
		throw new Error('No socket found');
	}
	const socket = res?.request?.res?.socket || res?.request?.res?.req?.socket;
	const info = socket.getPeerCertificate(true);
	const valid = socket.authorized || false;

	const parsedInfo = parseCertificateInfo(info);

	return {
		valid: valid,
		certInfo: parsedInfo,
	};
};
