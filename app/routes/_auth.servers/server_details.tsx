import type { Server } from '@prisma/client';
import { useFetcher } from '@remix-run/react';
import bytes from 'bytes';
import { useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
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

export function ServerDetails({ server }: { server: Server }) {
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data == null) {
      fetcher.load(`/servers/${server.id}?index`);
    }
  }, [fetcher, server]);

  return (
    <SheetContent>
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
                  <Label className="text-left">
                    {drive.name}:\{drive.location} {bytes(Number(drive.size))}{' '}
                    {bytes(Number(drive.usage?.[0]?.free))} free
                  </Label>
                ))}
              </>
            ) : null}
          </div>
        )
      )}
      {/*<SheetFooter>
          <SheetClose asChild>
            <Button type="button">Close</Button>
          </SheetClose>
        </SheetFooter>*/}
    </SheetContent>
  );
}
