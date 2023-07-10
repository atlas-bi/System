import type { Server } from '@prisma/client';
import { useFetcher } from '@remix-run/react';
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
import { H2, H3 } from '~/components/ui/typography';
import { Separator } from '~/components/ui/separator';
import { Line } from 'react-chartjs-2';
import { BarChart } from '~/components/charts/driveBar';

const jsonParser = (str) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
};

export function ServerDetails({ server }: { server: Server }) {
  const fetcher = useFetcher();
  const logsFetcher = useFetcher();
  const historyFetcher = useFetcher();

  const [activeDrive, setActiveDrive] = useState('');

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data == null) {
      fetcher.load(`/servers/${server.id}?index`);
    }
  }, [fetcher, server]);

  useEffect(() => {
    if (logsFetcher.state === 'idle' && logsFetcher.data == null) {
      logsFetcher.load(`/servers/${server.id}/logs`);
    }
  }, [logsFetcher, server]);

  return (
    <SheetContent className="w-[400px] sm:w-10/12 sm:max-w-full overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
          {server.title}
        </SheetTitle>
        <SheetDescription>
          {server.host}
          {server.os && <> · {server.os}</>}
          {server.osVersion && <> · {server.osVersion}</>}
        </SheetDescription>
      </SheetHeader>

      {fetcher.state === 'loading' ? (
        <>loading..</>
      ) : (
        fetcher.data && (
          <div className="space-y-4">
            {fetcher.data.drives ? (
              <>
                <div className="grid gap-4 py-4 grid-cols-2">
                  {fetcher.data.drives.map((drive) => (
                    <div
                      key={drive.id}
                      className={`flex space-x-4 border rounded-md py-2 px-4 cursor-pointer ${
                        drive.id === activeDrive
                          ? 'outline outline-sky-400 outline-offset-2'
                          : activeDrive !== ''
                          ? 'text-muted-foreground'
                          : ''
                      }`}
                      onClick={() => {
                        setActiveDrive(drive.id);
                        historyFetcher.load(
                          `/servers/${server.id}/drives/${drive.id}`,
                        );
                      }}
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
                              <TableCell className="py-1">
                                Growth Rate
                              </TableCell>
                              <TableCell className="py-1">
                                {bytes(Number(drive.growthRate))} / day
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        )
      )}

      {historyFetcher.data?.drive && (
        <>
          <H3>Usage Trend</H3>
          <BarChart data={historyFetcher.data?.drive} />
          <small className="text-muted-foreground">
            Data grouped into daily buckets.
          </small>
        </>
      )}

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

      {/*<SheetFooter>
          <SheetClose asChild>
            <Button type="button">Close</Button>
          </SheetClose>
        </SheetFooter>*/}
    </SheetContent>
  );
}
