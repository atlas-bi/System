import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getDrive } from '~/models/server.server';
import { authenticator } from '~/services/auth.server';
import { startOfDay } from 'date-fns';

export const loader = async ({ params, request }: LoaderArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: `/auth/?returnTo=${encodeURI(
      new URL(request.url).pathname,
    )}`,
  });

  const drive = await getDrive({ id: params.driveId });
  if (!drive) {
    throw new Response('Not Found', { status: 404 });
  }

  const grouped = drive.usage.reduce((a, e) => {
    if (!a[startOfDay(e.createdAt).toString()]) {
      a[startOfDay(e.createdAt).toString()] = [];
    }
    a[startOfDay(e.createdAt).toString()].push({ free: e.free, used: e.used });
    return a;
  }, {});

  const usage = Object.entries(grouped)
    .map(([k, v]) => {
      return {
        createdAt: k,
        free: v.reduce((a, e) => a + Number(e.free), 0) / v.length,
        used: v.reduce((a, e) => a + Number(e.used), 0) / v.length,
      };
    })
    .reverse();

  return json({ drive: { ...drive, usage } });
};
