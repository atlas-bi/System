import type { LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { getServers } from '~/models/server.server';

export const loader: LoaderFunction = async () => {
  const servers = await getServers();
  return redirect(`/servers/${servers[0].id}`);
};
