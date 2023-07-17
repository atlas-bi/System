import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { authenticator } from '~/services/auth.server';

export const action = async ({ request }: ActionArgs) =>
	authenticator.logout(request, { redirectTo: '/' });

export const loader = async ({ request }: LoaderArgs) =>
	authenticator.logout(request, { redirectTo: '/' });
