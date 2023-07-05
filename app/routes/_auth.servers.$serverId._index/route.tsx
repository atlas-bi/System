import type { LoaderArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';

export const loader = async ({ params }: LoaderArgs) => {
  return redirect(`/servers/${params.serverId}/drives`);
};
