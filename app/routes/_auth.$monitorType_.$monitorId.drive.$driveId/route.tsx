import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getDriveNotifications } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';
import { Link, useFetcher, useLoaderData, useParams } from '@remix-run/react';
import { BarChart } from '~/components/charts/driveBar';
import { H1 } from '~/components/ui/typography';
import { MoveLeft } from 'lucide-react';
import { BellRing } from 'lucide-react';
import { MoveRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';
import bytes from 'bytes';
import { useEffect } from 'react';
import { Skeleton } from '~/components/ui/skeleton';
export const loader = async ({ params, request }: LoaderArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: `/auth/?returnTo=${encodeURI(
      new URL(request.url).pathname,
    )}`,
  });

  const drive = await getDriveNotifications({ id: params.driveId });

  return json({ drive });
};

export default function Index() {
  const { drive } = useLoaderData<typeof loader>();
  let { monitorId, monitorType } = useParams();
  const usageFetcher = useFetcher();

  useEffect(() => {
    if (usageFetcher.state === 'idle' && usageFetcher.data == null) {
      usageFetcher.load(
        `/${drive.monitor.type}/${drive.monitor.id}/drive/${drive.id}/usage`,
      );
    }
  }, [usageFetcher]);

  return (
    <>
      <div className="flex justify-between">
        <Link
          to={`/${monitorType}/${monitorId}`}
          className="flex content-center space-x-2 pb-4 text-slate-600"
          prefetch="intent"
        >
          <MoveLeft size={16} className="my-auto" />
          <span className="my-auto">
            Back to <strong>{drive.monitor.title}</strong>
          </span>
        </Link>

        <Link
          to={`/${monitorType}/${monitorId}/drive/${drive.id}/notifications`}
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

      <div className="space-y-4">
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

        {usageFetcher.data?.drive ? (
          <>
            <BarChart data={usageFetcher.data.drive} />
            <small className="text-muted-foreground">
              Data grouped into daily buckets.
            </small>
          </>
        ) : (
          <div className="py-4">
            <Skeleton className="border rounded-md min-h-[450px]" />
          </div>
        )}
      </div>
    </>
  );
}
