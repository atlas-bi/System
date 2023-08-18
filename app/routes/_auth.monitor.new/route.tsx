import { ActionArgs, redirect } from '@remix-run/node';
import { json } from '@remix-run/node';
import { NodeSSH } from 'node-ssh';
import { namedAction } from 'remix-utils';
import {
	createMonitor,
	deleteMonitor,
	editMonitor,
} from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';
import { HttpCheck } from '~/monitors/http.server';
import mssql from 'mssql';
const isNullOrEmpty = (str: string | undefined | FormDataEntryValue) => {
	if (str === undefined || str === null || str.toString().trim() === '') {
		return true;
	}
	return false;
};

const jsonParser = (str: any) => {
	try {
		return JSON.parse(str);
	} catch (e) {
		console.log(e);
		return str;
	}
};

const checkBase = function ({ values }) {
	if (isNullOrEmpty(values.title)) {
		return json({ form: { error: 'Name is required.' } });
	}
	if (isNullOrEmpty(values.type)) {
		return json({ form: { error: 'Type is required.' } });
	}
};

const checkHttp = function ({ values }) {
	if (values.type !== 'http') return null;

	if (isNullOrEmpty(values.httpUrl)) {
		return json({ form: { error: 'URL is required.' } });
	}
};

const checkSql = function ({ values }) {
	if (values.type !== 'sqlServer') return null;

	if (isNullOrEmpty(values.sqlConnectionString)) {
		return json({ form: { error: 'Connection string is required.' } });
	}
};

const checkSsh = function ({ values }) {
	if (values.type !== 'windows' && values.type !== 'ubuntu') return null;

	if (isNullOrEmpty(values.host)) {
		return json({ form: { error: 'Host is required.' } });
	}

	if (isNullOrEmpty(values.username)) {
		return json({ form: { error: 'Username is required.' } });
	}

	if (isNullOrEmpty(values.password) && isNullOrEmpty(values.privateKey)) {
		return json({
			form: { error: 'Password or Private Key is required.' },
		});
	}
};

export async function action({ request }: ActionArgs) {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	return namedAction(request, {
		async new() {
			const formData = await request.formData();
			const { _action, ...values } = Object.fromEntries(formData);

			const baseErrors = checkBase({ values });
			if (baseErrors) {
				return baseErrors;
			}

			const sshErrors = checkSsh({ values });

			if (sshErrors) {
				return sshErrors;
			}

			const httpErrors = checkHttp({ values });
			if (httpErrors) {
				return httpErrors;
			}

			const sqlErrors = checkSql({ values });
			if (sqlErrors) {
				return sqlErrors;
			}

			let monitor = {};

			if (values.id) {
				monitor = await editMonitor({
					id: values.id.toString(),
					title: values.title.toString(),
					host: values.host ? values.host.toString() : null,
					username: values.username ? values.username.toString() : null,
					enabled: values.enabled.toString() == 'true',
					password: values.password ? values.password.toString() : null,
					privateKey:
						values.privateKey && values.privateKey.toString() != 'null'
							? values.privateKey.toString()
							: null,
					port: (values.port || 22).toString(),
					type: values.type.toString(),
					description:
						values.description && values.description.toString() != 'null'
							? values.description.toString()
							: null,
					httpUrl: values.httpUrl ? values.httpUrl.toString() : null,
					httpIgnoreSsl: values.httpIgnoreSsl?.toString() == 'true',
					httpAcceptedStatusCodes: values.httpAcceptedStatusCodes
						? jsonParser(values.httpAcceptedStatusCodes)
						: [],
					httpMaxRedirects: values.httpMaxRedirects
						? values.httpMaxRedirects.toString()
						: null,
					httpRequestMethod: values.httpRequestMethod
						? values.httpRequestMethod.toString()
						: null,
					httpBodyEncoding: values.httpBodyEncoding
						? values.httpBodyEncoding.toString()
						: null,
					httpBody: values.httpBodyText ? values.httpBodyText.toString() : null,
					httpHeaders: values.httpHeaderText
						? values.httpHeaderText.toString()
						: null,
					httpAuthentication: values.httpAuthentication
						? values.httpAuthentication.toString()
						: null,
					httpUsername: values.httpUsername
						? values.httpUsername.toString()
						: null,
					httpPassword: values.httpPassword
						? values.httpPassword.toString()
						: null,
					httpDomain: values.httpDomain ? values.httpDomain.toString() : null,
					httpWorkstation: values.httpWorkstation
						? values.httpWorkstation.toString()
						: null,
					sqlConnectionString: values.sqlConnectionString
						? values.sqlConnectionString.toString()
						: null,
				});

				return json({ monitor });
			} else {
				monitor = await createMonitor({
					title: values.title.toString(),
					host: values.host ? values.host.toString() : null,
					username: values.username ? values.username.toString() : null,
					enabled: values.enabled?.toString() == 'true',
					password: values.password ? values.password.toString() : null,
					privateKey:
						values.privateKey && values.privateKey.toString() != 'null'
							? values.privateKey.toString()
							: null,
					port: (values.port || 22).toString(),
					type: values.type.toString(),
					description:
						values.description && values.description.toString() != 'null'
							? values.description.toString()
							: null,
					httpUrl: values.httpUrl ? values.httpUrl.toString() : null,
					httpIgnoreSsl: values.httpIgnoreSsl?.toString() == 'true',
					httpAcceptedStatusCodes: values.httpAcceptedStatusCodes
						? jsonParser(values.httpAcceptedStatusCodes)
						: [],
					httpMaxRedirects: values.httpMaxRedirects
						? values.httpMaxRedirects.toString()
						: null,
					httpRequestMethod: values.httpRequestMethod
						? values.httpRequestMethod.toString()
						: null,
					httpBodyEncoding: values.httpBodyEncoding
						? values.httpBodyEncoding.toString()
						: null,
					httpBody: values.httpBodyText ? values.httpBodyText.toString() : null,
					httpHeaders: values.httpHeaderText
						? values.httpHeaderText.toString()
						: null,
					httpAuthentication: values.httpAuthentication
						? values.httpAuthentication.toString()
						: null,
					httpUsername: values.httpUsername
						? values.httpUsername.toString()
						: null,
					httpPassword: values.httpPassword
						? values.httpPassword.toString()
						: null,
					httpDomain: values.httpDomain ? values.httpDomain.toString() : null,
					httpWorkstation: values.httpWorkstation
						? values.httpWorkstation.toString()
						: null,
					sqlConnectionString: values.sqlConnectionString
						? values.sqlConnectionString.toString()
						: null,
				});
			}
			return json({ monitor });
		},
		async delete() {
			const formData = await request.formData();
			const { _action, ...values } = Object.fromEntries(formData);

			await deleteMonitor({ id: values.id });
			return redirect('/');
		},
		async test() {
			const formData = await request.formData();
			const { _action, ...values } = Object.fromEntries(formData);

			const baseErrors = checkBase({ values });
			if (baseErrors) {
				return baseErrors;
			}

			const sshErrors = checkSsh({ values });

			if (sshErrors) {
				return sshErrors;
			}

			const httpErrors = checkHttp({ values });
			if (httpErrors) {
				return httpErrors;
			}

			const sqlErrors = checkSql({ values });
			if (sqlErrors) {
				return sqlErrors;
			}

			if (
				values.type?.toString() === 'windows' ||
				values.type?.toString() === 'ubuntu'
			) {
				const ssh = new NodeSSH();

				try {
					await ssh.connect({
						...values,
					});
				} catch (e) {
					console.log(e);
					return json({ error: e });
				}
				return json({ success: 'Connection successful.' });
			}

			if (values.type?.toString() === 'http') {
				let startTime = new Date();

				const { res, error } = await HttpCheck({
					httpBody: values.httpBody?.toString(),
					httpAuthentication: values.httpAuthentication?.toString(),
					httpUsername: values.httpUsername?.toString(),
					httpPassword: values.httpPassword?.toString(),
					httpIgnoreSsl: !!values.httpIgnoreSsl,
					httpBodyEncoding: values.httpBodyEncoding?.toString(),
					httpUrl: values.httpUrl?.toString(),
					httpMethod: values.httpMethod?.toString(),
					httpHeaders: values.httpHeaders?.toString(),
					httpMaxRedirects: values.httpMaxRedirects?.toString(),
					httpAcceptedStatusCodes: jsonParser(values.httpAcceptedStatusCodes),
					httpDomain: values.httpDomain?.toString(),
					httpWorkstation: values.httpWorkstation?.toString(),
				});

				if (error) {
					return json({ error });
				}

				// console.log(res)
				const msg = res?.status + res?.statusText;
				const ping = new Date() - startTime;
				console.log(msg, ping);
				return json({
					success: `Connected with ${res?.status} ${res?.statusText} (${ping}ms)`,
				});
			}

			if (values.type?.toString() === 'sqlServer') {
				let pool;
				try {
					pool = new mssql.ConnectionPool(
						values.sqlConnectionString?.toString(),
					);
					await pool.connect();
					await pool.request().query('select @@version');
					pool.close();
					return json({ success: 'Connection successful.' });
				} catch (e) {
					if (pool) {
						pool.close();
					}
					return json({ error: { message: e.toString() } });
				}
			}

			return null;
		},
	});
}
