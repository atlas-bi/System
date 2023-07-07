import { cn } from '@/lib/utils';
import { Form, Link, useFetcher } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { Button, buttonVariants } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

import { Textarea } from '../ui/textarea';

type Data = {
  name?: string;
  port?: number;
  username?: string;
  host?: string;
  password?: string;
  privateKey?: string;
};

export default function NewServer({ className }: { className: string }) {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher();
  const testFetcher = useFetcher();

  const [data, setData] = useState<Data>({});

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.success != null) {
      setData({});
      setOpen(false);
    }
  }, [fetcher]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className={className}>
          Add Server
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:min-w-[425px] sm:max-w-fit">
        <DialogHeader>
          <DialogTitle>Add Server</DialogTitle>
          <DialogDescription>Add a new server for monitoring</DialogDescription>
        </DialogHeader>
        {testFetcher.data?.error?.code ? (
          <small className="text-red-700">
            {testFetcher.data?.error?.code}
          </small>
        ) : testFetcher.data?.error ? (
          <small className="text-red-700">Failed to connect.</small>
        ) : (
          <></>
        )}
        {testFetcher.state !== 'submitting' && testFetcher.data?.form?.error ? (
          <small className="text-red-700">{testFetcher.data.form.error}</small>
        ) : null}
        {fetcher.state !== 'submitting' && fetcher.data?.form?.error ? (
          <small className="text-red-700">{fetcher.data.form.error}</small>
        ) : null}
        {testFetcher.state !== 'submitting' && testFetcher.data?.success ? (
          <small className="text-green-700">{testFetcher.data.success}</small>
        ) : null}
        <Form method="post" action="/servers/new">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                type="text"
                id="name"
                placeholder="Server 1"
                className="col-span-3"
                onChange={(e) => setData({ ...data, name: e.target.value })}
              />
              <Label htmlFor="host" className="text-right">
                Host
              </Label>
              <Input
                type="text"
                id="host"
                placeholder="server1"
                className="col-span-3"
                onChange={(e) => setData({ ...data, host: e.target.value })}
              />
              <Label htmlFor="port" className="text-right">
                Port
              </Label>
              <Input
                type="number"
                value="22"
                id="port"
                placeholder="22"
                className="col-span-3"
                onChange={(e) =>
                  setData({ ...data, port: Number(e.target.value) })
                }
              />
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                type="text"
                id="username"
                placeholder="username"
                className="col-span-3"
                onChange={(e) => setData({ ...data, username: e.target.value })}
              />
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                type="password"
                id="password"
                placeholder="123"
                className="col-span-3"
                onChange={(e) => setData({ ...data, password: e.target.value })}
              />
              <Label htmlFor="privateKey" className="text-right">
                Private Key
              </Label>
              <Textarea
                id="privateKey"
                className="col-span-3"
                onChange={(e) =>
                  setData({ ...data, privateKey: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={(e) => {
                fetcher.submit(
                  { _action: 'new', ...data },
                  { method: 'post', action: '/servers/new' },
                );
              }}
            >
              Save
            </Button>

            <Button
              type="button"
              onClick={(e) => {
                testFetcher.submit(
                  { _action: 'test', ...data },
                  { method: 'post', action: '/servers/new' },
                );
              }}
            >
              {testFetcher.state !== 'submitting' ? <>Test</> : <>Testing...</>}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
