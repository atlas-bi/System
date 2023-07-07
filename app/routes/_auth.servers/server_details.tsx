import type { Server } from '@prisma/client';
import { useFetcher } from '@remix-run/react';
import bytes from 'bytes';
import { useEffect } from 'react';
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
    <SheetContent className="w-[400px] sm:w-5/12 sm:max-w-full">
      <SheetHeader>
        <SheetTitle>{server.title}</SheetTitle>
        <SheetDescription>{server.hostname}</SheetDescription>
      </SheetHeader>

      {fetcher.state === 'loading' ? (
        <>loading..</>
      ) : (
        fetcher.data && (
          <div className="grid gap-4 py-4">
            {fetcher.data.drives ? (
              <>
                Drives
                {fetcher.data.drives.map((drive) => (
                  <Label key={drive.id} className="text-left">
                    {drive.name}:\{drive.location} {bytes(Number(drive.size))}{' '}
                    {bytes(Number(drive.usage?.[0]?.free))} free
                    {drive.daysTillFull && (
                      <> {drive.daysTillFull} days till full</>
                    )}
                  </Label>
                ))}
              </>
            ) : null}
          </div>
        )
      )}

      {logsFetcher.state === 'loading' ? (
        <>loading logs..</>
      ) : (
        <>
          {logsFetcher.data?.logs && (
            <Table>
              <TableCaption>Recent Logs..</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsFetcher.data.logs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {format(new Date(log.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{log.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
