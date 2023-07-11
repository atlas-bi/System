import type { Server } from '@prisma/client';
import { Link, useFetcher } from '@remix-run/react';
import bytes from 'bytes';
import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { compareAsc, format } from 'date-fns';
import { Label } from '~/components/ui/label';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { DoughnutChart } from '~/components/charts/driveDoughnut';
import { ChartArea } from 'chart.js';
import { H1, H2, H3 } from '~/components/ui/typography';
import { Separator } from '~/components/ui/separator';
import { Line } from 'react-chartjs-2';
import { BarChart } from '~/components/charts/driveBar';

import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getServer, getServerDrives } from '~/models/server.server';
import { authenticator } from '~/services/auth.server';

import { useLoaderData } from '@remix-run/react';
import { Sheet } from '~/components/ui/sheet';
import { MoveLeft } from 'lucide-react';

export const loader = async ({ params, request }: LoaderArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: `/auth/?returnTo=${encodeURI(
      new URL(request.url).pathname,
    )}`,
  });

  return json({
    server: await getServer({ id: params.serverId }),
    drives: await getServerDrives({ serverId: params.serverId }),
  });
};

const jsonParser = (str) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
};

export default function Index() {
  const { server, drives } = useLoaderData<typeof loader>();
  const logsFetcher = useFetcher();
  const [activeDrive, setActiveDrive] = useState('');

  useEffect(() => {
    if (logsFetcher.state === 'idle' && logsFetcher.data == null) {
      logsFetcher.load(`/servers/${server.id}/logs`);
    }
  }, [logsFetcher, server]);

  return (
    <>
      <Link
        to="/servers"
        className="flex content-center space-x-2 pb-4 text-slate-700"
        prefetch="intent"
      >
        <MoveLeft size={16} className="my-auto" />
        <span className="my-auto">Back to Servers</span>
      </Link>

      <H1>{server.title}</H1>
      <div className="text-muted-foreground">
        {server.host}
        {server.os && <> · {server.os}</>}
        {server.osVersion && <> · {server.osVersion}</>}
      </div>

      <div className="space-y-4">
        {drives ? (
          <>
            <div className="grid gap-4 py-4 grid-cols-2">
              {drives.map((drive) => (
                <Link
                  to={`/servers/${server.id}/drives/${drive.id}`}
                  prefetch="intent"
                  key={drive.id}
                  className={`flex space-x-4 border rounded-md py-2 px-4 cursor-pointer hover:shadow hover:shadow-sky-200 ${
                    drive.id === activeDrive
                      ? 'outline outline-sky-400 outline-offset-2'
                      : activeDrive !== ''
                      ? 'text-muted-foreground'
                      : ''
                  }`}
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
                          <TableCell className="py-1">Days Till Full</TableCell>
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
              ))}
            </div>
          </>
        ) : null}
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
              {logsFetcher.data?.logs?.map((log) => {
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
