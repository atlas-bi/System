import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { getDriveLatestFeeds } from '~/models/drive.server';
import { authenticator } from '~/services/auth.server';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	invariant(params.driveId, 'Drive ID is required.');
	const feeds = await getDriveLatestFeeds({
		id: params.driveId,
	});

	return json({ feeds });
};
