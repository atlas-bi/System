import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getFileNotifications } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';
import { Link, useLoaderData, useParams } from '@remix-run/react';
import { H1, H3 } from '~/components/ui/typography';
import { Loader2, MoveLeft } from 'lucide-react';

import { useSubmit, useNavigation } from '@remix-run/react';

import { useRef } from 'react';

import { getNotifications } from '~/models/notification.server';

export const loader = async ({ params, request }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	const file = await getFileNotifications({ id: params.fileId });
	if (!file) {
		throw new Response('Not Found', { status: 404 });
	}

	const notifications = await getNotifications();

	return json({ file, notifications });
};

export async function action({ request, params }: ActionArgs) {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});
	const formData = await request.formData();
	const { ...values } = Object.fromEntries(formData);

	return null;
}

export default function Index() {
	const { file, notifications } = useLoaderData<typeof loader>();

	const submit = useSubmit();
	const transition = useNavigation();
	const notificationsMap = notifications.map(
		(n: { name: string; id: string }) => {
			return { label: n.name, value: n.id };
		},
	);
	let { monitorType, monitorId, databaseId } = useParams();

	const form = useRef<HTMLFormElement>(null);

	function handleChange(event: { currentTarget: HTMLFormElement }) {
		submit(event.currentTarget);
	}

	return (
		<>
			<div className="flex space-x-2 pb-4">
				<Link
					to={`/${monitorType}/${monitorId}/database/${databaseId}/file/${file.id}`}
					className={`transition-colors flex content-center space-x-2  text-slate-600 ${
						transition.state === 'submitting' ? 'pointer-events-none' : ''
					}`}
					prefetch="intent"
				>
					<MoveLeft size={16} className="my-auto" />
					<span className="my-auto">
						Back to <strong>{file.fileName}</strong>
					</span>
				</Link>
				{transition.state === 'submitting' ? (
					<Loader2 size={14} className="animate-spin my-auto" />
				) : null}
			</div>
			<H1>Notifications for {file.fileName}</H1>
			<div className="space-y-4">
				<div className=" rounded-lg border p-4 max-w-[500px]">
					<div className="space-y-2">
						<div className="space-y-2 flex justify-between">
							<div className="flex-grow">
								<H3 className="text-2xl">Free Space</H3>
								<div className="text-muted-foreground pb-2">
									Recieve notification when files free space meets certain
									criteria.{' '}
									<strong>
										This only applies to files with auto growth disabled.
									</strong>
								</div>
								<Link
									to={`/${monitorType}/${monitorId}/notifications`}
									className="text-sm text-sky-600/80"
								>
									Edit this notification is managed at the server level.
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
