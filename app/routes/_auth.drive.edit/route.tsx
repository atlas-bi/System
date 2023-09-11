import { ActionArgs, redirect } from '@remix-run/node';
import { json } from '@remix-run/node';
import { namedAction } from 'remix-utils';
import { editDrive, getDriveMonitor, deleteDrive } from '~/models/drive.server';
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
		async delete() {
			const formData = await request.formData();
			const { _action, ...values } = Object.fromEntries(formData);

			const drive = await getDriveMonitor({
				id: values.id.toString(),
			});

			await deleteDrive({
				id: values.id.toString(),
			});
			if (!drive) {
				return redirect('/');
			}
			return redirect(`/${drive.monitor.type}/${drive.monitor.id}`);
		},
	});
}
