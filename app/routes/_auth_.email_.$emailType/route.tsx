import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useParams } from '@remix-run/react';
import { prisma } from '~/db.server';

import {
	SuccessEmail,
	ErrorEmail,
} from '~/notifications/email/monitors/collection';
import { SuccessEmail as RebootEmail } from '~/notifications/email/monitors/reboot';
import {
	SuccessEmail as PercentFreeSuccessEmail,
	ErrorEmail as PercentFreeErrorEmail,
} from '~/notifications/email/drives/percentFree';
import { authenticator } from '~/services/auth.server';

export const loader = async ({ request, params }: LoaderArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	const monitor = await prisma.monitor.findFirst({});

	return json({ monitor: monitor!, hostname: process.env.HOSTNAME });
};

export default function Index() {
	const { monitor, hostname } = useLoaderData<typeof loader>();
	let { emailType } = useParams();
	// Type assertion needed because email components expect Prisma Monitor type
	// but Remix serializes Date objects to strings
	const monitorForEmail = monitor as any;

	const successSubject =
		'💚 [bing (https://bing.com)] Data collection restored.';
	const errorSubject = '💔 [bing (https://bing.com)] Data collection failed.';
	const errorMessage = 'ECCONBLAH';
	const mockDrive = { name: 'C:', percentFree: 25 } as any;
	if (emailType == 'collectionError') {
		return (
			<ErrorEmail
				hostname={hostname}
				monitor={monitorForEmail}
				message={errorMessage}
			/>
		);
	}

	if (emailType == 'collectionSuccess') {
		return (
			<SuccessEmail
				hostname={hostname}
				subject={successSubject}
				monitor={monitorForEmail}
			/>
		);
	}

	if (emailType == 'reboot') {
		return <RebootEmail hostname={hostname} monitor={monitorForEmail} />;
	}

	if (emailType == 'percentFreeSuccess') {
		return (
			<PercentFreeSuccessEmail
				hostname={hostname}
				subject={successSubject}
				monitor={monitorForEmail}
				drive={mockDrive}
			/>
		);
	}

	if (emailType == 'percentFreeError') {
		return (
			<PercentFreeErrorEmail
				hostname={hostname}
				message={errorMessage}
				monitor={monitorForEmail}
				drive={mockDrive}
			/>
		);
	}

	return <></>;
}
