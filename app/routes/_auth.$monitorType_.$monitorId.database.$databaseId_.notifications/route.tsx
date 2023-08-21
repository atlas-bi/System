import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
	getDatabaseNotifications,
	getDriveNotifications,
	updateDriveNotifications,
} from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';
import { Form, Link, useLoaderData, useParams } from '@remix-run/react';
import { H1, H3 } from '~/components/ui/typography';
import { Loader2, MoveLeft } from 'lucide-react';
import { Switch } from '~/components/ui/switch';
import { useSubmit, useNavigation } from '@remix-run/react';
import { Collapsible, CollapsibleContent } from '~/components/ui/collapsible';

import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator';
import { useRef, useState } from 'react';
import { Input } from '~/components/ui/input';
import { MultiSelect } from '~/components/ui/multiselect';
import { getNotifications } from '~/models/notification.server';

export const loader = async ({ params, request }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	const database = await getDatabaseNotifications({ id: params.databaseId });
	if (!database) {
		throw new Response('Not Found', { status: 404 });
	}

	const notifications = await getNotifications();

	return json({ database, notifications });
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
	const { database, notifications } = useLoaderData<typeof loader>();

	const submit = useSubmit();
	const transition = useNavigation();
	const notificationsMap = notifications.map(
		(n: { name: string; id: string }) => {
			return { label: n.name, value: n.id };
		},
	);
	let { monitorType, monitorId } = useParams();

	const form = useRef<HTMLFormElement>(null);

	function handleChange(event: { currentTarget: HTMLFormElement }) {
		submit(event.currentTarget);
	}

	return (
		<>
			<div className="flex space-x-2 pb-4">
				<Link
					to={`/${monitorType}/${monitorId}/database/${database.id}`}
					className={`transition-colors flex content-center space-x-2  text-slate-600 ${
						transition.state === 'submitting' ? 'pointer-events-none' : ''
					}`}
					prefetch="intent"
				>
					<MoveLeft size={16} className="my-auto" />
					<span className="my-auto">
						Back to <strong>{database.name}</strong>
					</span>
				</Link>
				{transition.state === 'submitting' ? (
					<Loader2 size={14} className="animate-spin my-auto" />
				) : null}
			</div>
			<H1>Notifications for {database.name}</H1>
			coming soon.
		</>
	);
}
