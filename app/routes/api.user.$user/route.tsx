import { LoaderArgs, json } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { getUserBySlug } from '~/models/user.server';
import { authenticator } from '~/services/auth.server';

export const loader = async ({ request, params }: LoaderArgs) => {
	let user = await authenticator.isAuthenticated(request);
	if (!user) return json({});

	const { user: slug } = params;

	invariant(slug);

	return json({ user: await getUserBySlug(slug) });
};
