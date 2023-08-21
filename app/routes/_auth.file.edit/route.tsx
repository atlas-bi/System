import { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { namedAction } from 'remix-utils';
import { editFile } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';

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

			const file = await editFile({
				id: values.id.toString(),
				enabled: values.enabled.toString() == 'true',
			});
			return json({ file });
		},
	});
}
