import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { namedAction } from '~/utils';
import { editDatabase } from '~/models/monitor.server';
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

			const database = await editDatabase({
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
			return json({ database });
		},
	});
}
