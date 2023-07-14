import bytes from 'bytes';
import { useEffect } from 'react';

import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { DoughnutChart } from '~/components/charts/driveDoughnut';
import { H1, H2, H3 } from '~/components/ui/typography';
import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getMonitorPublic } from '~/models/monitor.server';
import { authenticator } from '~/services/auth.server';

import { Link, useFetcher, useLoaderData } from '@remix-run/react';
import { MoveLeft } from 'lucide-react';
import { Skeleton } from '~/components/ui/skeleton';
import invariant from 'tiny-invariant';

import type { Drive, DriveUsage, MonitorLogs } from '~/models/monitor.server';

export const loader = async ({ params, request }: LoaderArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: `/auth/?returnTo=${encodeURI(
      new URL(request.url).pathname,
    )}`,
  });

  invariant(params.monitorId, 'Monitor ID is required.');
  const monitor = await getMonitorPublic({ id: params.monitorId });
  invariant(monitor, 'Monitor not found.');
  return json({
    monitor,
  });
};

const jsonParser = (str: string) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
};

export default function Index() {
  const { monitor } = useLoaderData<typeof loader>();
  const logsFetcher = useFetcher();
  const drivesFetcher = useFetcher();

  useEffect(() => {
    if (logsFetcher.state === 'idle' && logsFetcher.data == null) {
      logsFetcher.load(`/${monitor.type}/${monitor.id}/logs`);
    }
  }, [logsFetcher, monitor]);

  useEffect(() => {
    if (drivesFetcher.state === 'idle' && drivesFetcher.data == null) {
      drivesFetcher.load(`/${monitor.type}/${monitor.id}/drives`);
    }
  }, [drivesFetcher, monitor]);

  return (
    <>
      <Link
        to={`/${monitor.type}`}
        className="flex content-center space-x-2 pb-4 text-slate-700"
        prefetch="intent"
      >
        <MoveLeft size={16} className="my-auto" />
        <span className="my-auto">Back to Monitors</span>
      </Link>

      <H1>{monitor.title}</H1>
      <div className="text-muted-foreground">
        {monitor.host}
        {monitor.os && (
          <>
            {monitor.host && <> · </>}
            {monitor.os}
          </>
        )}
        {monitor.osVersion && (
          <>
            {(monitor.host || monitor.os) && <> · </>}
            {monitor.osVersion}
          </>
        )}
      </div>

      <div className="space-y-4">
        {drivesFetcher.data?.drives ? (
          <>
            <div className="grid gap-4 py-4 grid-cols-2">
              {drivesFetcher.data.drives.map(
                (drive: Drive & { usage: DriveUsage[] }) => (
                  <Link
                    to={`/${monitor.type}/${monitor.id}/drive/${drive.id}`}
                    prefetch="intent"
                    key={drive.id}
                    className="flex space-x-4 border rounded-md py-2 px-4 cursor-pointer hover:shadow hover:shadow-sky-200"
                  >
                    <DoughnutChart
                      className="w-36 h-36"
                      data={{
                        labels: [
                          `Used ${bytes(Number(drive.usage?.[0]?.used))}`,
                          `Free ${bytes(Number(drive.usage?.[0]?.free))}`,
                        ],
                        datasets: [
                          {
                            label: 'Drive Usage',
                            data: [
                              Number(drive.usage?.[0]?.used),
                              Number(drive.usage?.[0]?.used) +
                                Number(drive.usage?.[0]?.free) ==
                              0
                                ? 100
                                : Number(drive.usage?.[0]?.free),
                            ],
                          },
                        ],
                      }}
                    />

                    <div className="space-y-2 flex-grow">
                      <H3>
                        {drive.name}:\{drive.location}
                      </H3>

                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="py-1 font-medium">
                              Size
                            </TableCell>
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
                            <TableCell className="py-1">
                              Days Till Full
                            </TableCell>
                            <TableCell className="py-1">
                              {drive.daysTillFull}
                            </TableCell>
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
                  </Link>
                ),
              )}
            </div>
          </>
        ) : (
          <div className="grid gap-4 py-4 grid-cols-2">
            <Skeleton className="border rounded-md min-h-[200px]" />
            <Skeleton className="border rounded-md min-h-[200px]" />
          </div>
        )}
      </div>

      {logsFetcher.data?.logs && logsFetcher.data.logs.length > 0 && (
        <>
          <H3>Error Logs </H3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="">Date</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsFetcher.data?.logs?.map((log: MonitorLogs) => {
                const message = jsonParser(log.message);

                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium py-1">
                      {format(new Date(log.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {message?.errno} {message?.code}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      )}
    </>
  );
}
