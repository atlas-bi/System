import {
	Monitor,
	getMonitorDisabledDrives,
	monitorError,
	setDriveDays,
	setDriveGrowth,
	updateMonitor,
	updateFeedError,
	setFeedError,
} from '~/models/monitor.server';
import https from 'https';

import Notifier from '~/notifications/notifier';
import { disposeSsh } from './helpers.server';
import { NodeSSH } from 'node-ssh';
import { decrypt } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { NtlmClient, NtlmCredentials } from 'axios-ntlm';
import { jsonParser } from '~/utils';

const checkStatusCode = (
	status: number,
	codes: number | string | string[] | undefined,
) => {
	// any code is ok
	if (!codes || codes.length === 0) {
		return true;
	}

	const check = (status: number, code: string) => {
		if (code === '100s') {
			return 100 <= status && status <= 199;
		} else if (code === '200s') {
			return 200 <= status && status <= 299;
		} else if (code === '300s') {
			return 300 <= status && status <= 399;
		} else if (code === '400s') {
			return 400 <= status && status <= 499;
		} else if (code === '500s') {
			return 500 <= status && status <= 599;
		} else if (Number(code) === status) {
			return true;
		}
		return false;
	};

	if (typeof codes === 'string' || typeof codes === 'number') {
		return check(status, codes);
	}

	const matched = codes.map((c) => check(status, c)).filter((x) => x);
	return matched.length > 0;
};

const encodeBase64 = (user, pass) => {
	return Buffer.from(user + ':' + pass).toString('base64');
};

export async function HttpCheck({
	httpBody,
	httpAuthentication,
	httpUsername,
	httpPassword,
	httpIgnoreSsl,
	httpBodyEncoding,
	httpUrl,
	httpMethod,
	httpHeaders,
	httpMaxRedirects,
	httpAcceptedStatusCodes,
	httpDomain,
	httpWorkstation,
	httpBodyText,
	httpHeaderText,
}: {
	httpBody?: string;
	httpAuthentication?: string;
	httpUsername?: string;
	httpPassword?: string;
	httpIgnoreSsl?: boolean;
	httpBodyEncoding?: string;
	httpUrl?: string;
	httpMethod?: string;
	httpHeaders?: string;
	httpMaxRedirects?: string;
	httpAcceptedStatusCodes?: string[];
	httpDomain?: string;
	httpWorkstation?: string;
}) {
	// HTTP basic auth
	let basicAuthHeader = {};

	if (httpAuthentication === 'basic') {
		basicAuthHeader = {
			Authorization:
				'Basic ' + encodeBase64(httpUsername, decrypt(httpPassword)),
		};
	}

	const httpsAgentOptions = {
		maxCachedSessions: 0, // Use Custom agent to disable session reuse (https://github.com/nodejs/node/issues/3940)
		rejectUnauthorized: !httpIgnoreSsl,
	};

	let contentType = null;
	let bodyValue = null;

	if (httpBody && httpBody.trim().length > 0) {
		if (!httpBodyEncoding || httpBodyEncoding === 'json') {
			try {
				bodyValue = JSON.parse(httpBody);
				contentType = 'application/json';
			} catch (e) {
				throw new Error('JSON body is invalid. ' + e.message);
			}
		} else if (httpBodyEncoding === 'xml') {
			bodyValue = httpBody;
			contentType = 'text/xml; charset=utf-8';
		}
	}

	// Axios Options
	const options: AxiosRequestConfig = {
		url: httpUrl,
		method: httpMethod ? httpMethod.toLowerCase() : 'get',
		timeout: 3 * 1000,
		headers: {
			Accept:
				'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
			'User-Agent': 'Atlas-System/',
			...(contentType ? { 'Content-Type': contentType } : {}),
			...basicAuthHeader,
			...(httpHeaders ? JSON.parse(httpHeaders) : {}),
		},
		maxRedirects: httpMaxRedirects ? Number(httpMaxRedirects) : undefined,
		validateStatus: (status) => {
			return checkStatusCode(status, jsonParser(httpAcceptedStatusCodes));
		},
	};

	if (!options.httpsAgent) {
		options.httpsAgent = new https.Agent(httpsAgentOptions);
	}

	if (bodyValue) {
		options.data = bodyValue;
	}

	let res;

	try {
		if (httpAuthentication === 'ntlm') {
			options.httpsAgent.keepAlive = true;

			let credentials: NtlmCredentials = {
				username: httpUsername || '',
				password: httpPassword ? decrypt(httpPassword) : '',
				domain: httpDomain || '',
				workstation: httpWorkstation ? httpWorkstation : undefined,
			};

			let client = NtlmClient(credentials);

			res = await client(options);
		} else {
			res = await axios.request(options);
		}

		// return res;
	} catch (e) {
		console.log(e);
		return { error: { message: e.code || e.message } };
		// Fix #2253
		// Read more: https://stackoverflow.com/questions/1759956/curl-error-18-transfer-closed-with-outstanding-read-data-remaining
		// if (!finalCall && typeof e.message === "string" && e.message.includes("maxContentLength size of -1 exceeded")) {
		//     log.debug("monitor", "makeAxiosRequest with gzip");
		//     options.headers["Accept-Encoding"] = "gzip, deflate";
		//     return this.makeAxiosRequest(options, true);
		// } else {
		//     if (typeof e.message === "string" && e.message.includes("maxContentLength size of -1 exceeded")) {
		//         e.message = "response timeout: incomplete response within a interval";
		//     }
		//     throw e;
		// }
	}

	return { res };
}

export default async function HttpMonitor({ monitor }: { monitor: Monitor }) {
	// most thanks to https://github.com/louislam/uptime-kuma/blob/de8386362710973d00b8bbc41374753d3500219c/server/model/monitor.js#L1015

	const {
		httpBody,
		httpAuthentication,
		httpUsername,
		httpPassword,
		httpIgnoreSsl,
		httpBodyEncoding,
		httpUrl,
		httpMethod,
		httpHeaders,
		httpMaxRedirects,
		httpAcceptedStatusCodes,
		httpDomain,
		httpWorkstation,
	} = monitor;

	let startTime = new Date();
	let feed = undefined;

	try {
		const { res, error } = await HttpCheck({
			httpBody,
			httpAuthentication,
			httpUsername,
			httpPassword,
			httpIgnoreSsl,
			httpBodyEncoding,
			httpUrl,
			httpMethod,
			httpHeaders,
			httpMaxRedirects,
			httpAcceptedStatusCodes,
			httpDomain,
			httpWorkstation,
		});

		const ping = new Date() - startTime;

		const data = await updateMonitor({
			id: monitor.id,
			feed: {
				ping: ping.toString(),
			},
		});

		if (error) {
			// update feed to be an error
			if (data?.feeds) {
				await setFeedError({
					id: data?.feeds?.[0]?.id,
					hasError: true,
					message: error.message || error,
				});
			}
			throw new Error(error.message || error);
		}

		const msg = (res?.status || '') + (res?.statusText || '');

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
