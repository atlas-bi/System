import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getServerLogs } from '~/models/server.server';
import { authenticator } from '~/services/auth.server';

export const loader = async ({ params, request }: LoaderArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: `/auth/?returnTo=${encodeURI(
      new URL(request.url).pathname,
    )}`,
  });
  return json({ logs: await getServerLogs({ serverId: params.serverId }) });
};
