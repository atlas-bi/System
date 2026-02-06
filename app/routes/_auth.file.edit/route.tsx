import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { namedAction } from '~/utils';
import { editFile } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';

export async function action({ request }: ActionFunctionArgs) {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	return namedAction(request, {
		async edit(formData) {
			const { _action, ...values } = Object.fromEntries(formData);

			const file = await editFile({
				id: values.id.toString(),
				enabled: values.enabled.toString() == 'true',
			});
			return json({ file });
		},
	});
}
