import type { LoaderArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { getMonitorTypes } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';

export const loader = async ({ request }: LoaderArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: `/auth/?returnTo=${encodeURI(
      new URL(request.url).pathname,
    )}`,
  });

  const monitorTypes = await getMonitorTypes();

  if (monitorTypes && monitorTypes.length > 0) {
    return redirect(`/${monitorTypes[0].type}`);
  }

  return null;
};

export default function Index() {
  return <>Create a monitor to get started.</>;
}
