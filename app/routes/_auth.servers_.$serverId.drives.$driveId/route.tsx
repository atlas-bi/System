import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getDrive } from '~/models/server.server';
import { authenticator } from '~/services/auth.server';
import { startOfDay } from 'date-fns';
import { Link, useLoaderData, useParams } from '@remix-run/react';
import { BarChart } from '~/components/charts/driveBar';
import { H1, H3 } from '~/components/ui/typography';
import { MoveLeft } from 'lucide-react';
import { BellRing } from 'lucide-react';
import { MoveRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import bytes from 'bytes';
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
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

  return json({ drive: { ...drive, usage } });
};

export default function Index() {
  const { drive } = useLoaderData<typeof loader>();
  let { serverId } = useParams();

  return (
    <>
      <div className="flex justify-between">
        <Link
          to={`/servers/${serverId}`}
          className="flex content-center space-x-2 pb-4 text-slate-600"
          prefetch="intent"
        >
          <MoveLeft size={16} className="my-auto" />
          <span className="my-auto">
            Back to <strong>{drive.server.title}</strong>
          </span>
        </Link>

        <Link
          to={`/servers/${serverId}/drives/${drive.id}/notifications`}
          className="flex content-center space-x-2 pb-4 text-slate-600"
          prefetch="intent"
        >
          <BellRing size={16} className="my-auto" />
          <span className="my-auto">Manage Notifications</span>
          <MoveRight size={16} className="my-auto" />
        </Link>
      </div>

      <H1>
        {drive.name}:\{drive.location}
      </H1>

      <div className="space-y-2 flex-grow">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="py-1 font-medium">Size</TableCell>
              <TableCell className="py-1 text-slate-700">
                {' '}
                {bytes(Number(drive.size))}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="py-1">Used</TableCell>
              <TableCell className="py-1">
                {' '}
                {bytes(Number(drive.usage?.[0]?.used)) || '-1'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="py-1">Free</TableCell>
              <TableCell className="py-1">
                {' '}
                {bytes(Number(drive.usage?.[0]?.free)) || '-1'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="py-1">Days Till Full</TableCell>
              <TableCell className="py-1">{drive.daysTillFull}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="py-1">Growth Rate</TableCell>
              <TableCell className="py-1">
                {bytes(Number(drive.growthRate))} / day
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <BarChart data={drive} />
      <small className="text-muted-foreground">
        Data grouped into daily buckets.
      </small>
    </>
  );
}
