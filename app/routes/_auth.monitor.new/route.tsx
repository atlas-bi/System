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

const isNullOrEmpty = (str: string | undefined | FormDataEntryValue) => {
	if (str === undefined || str === null || str.toString().trim() === '') {
		return true;
	}
	return false;
};

const checkWindows = function ({ values }) {
	if (values.type !== 'windows') return null;
	if (isNullOrEmpty(values.title)) {
		return json({ form: { error: 'Name is required.' } });
	}

	if (isNullOrEmpty(values.type)) {
		return json({ form: { error: 'Type is required.' } });
	}

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

			const windowsErrors = checkWindows({ values });

			if (windowsErrors) {
				return windowsErrors;
			}

			let monitor = {};
			console.log(values);
			if (values.id) {
				monitor = await editMonitor({
					id: values.id.toString(),
					title: values.title.toString(),
					host: values.host.toString(),
					username: values.username.toString(),
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
				});

				return json({ monitor });
			} else {
				monitor = await createMonitor({
					title: values.title.toString(),
					host: values.host.toString(),
					username: values.username.toString(),
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

			const windowsErrors = checkWindows({ values });

			if (windowsErrors) {
				return windowsErrors;
			}

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
		},
	});
}
