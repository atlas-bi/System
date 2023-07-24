import { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { namedAction } from 'remix-utils';
import { editDrive } from '~/models/monitor.server';
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
		async edit() {
			const formData = await request.formData();
			const { _action, ...values } = Object.fromEntries(formData);

			const drive = await editDrive({
				id: values.id.toString(),
				title:
					values.title && values.title.toString() !== 'null'
						? values.title.toString()
						: null,
				enabled: values.enabled.toString() == 'true',
				description:
					values.description && values.description.toString() != 'null'
						? values.description.toString()
						: null,
			});
			return json({ drive });
		},
	});
}
