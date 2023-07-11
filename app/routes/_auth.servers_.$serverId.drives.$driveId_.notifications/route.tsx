import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getDriveNotifications } from '~/models/server.server';
import { authenticator } from '~/services/auth.server';
import { startOfDay } from 'date-fns';
import { Link, useLoaderData, useParams } from '@remix-run/react';
import { BarChart } from '~/components/charts/driveBar';
import { H1, H2, H3 } from '~/components/ui/typography';
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
import { Switch } from '~/components/ui/switch';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';

import { Button } from '~/components/ui/button';

import bytes from 'bytes';
import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator';
import { useState } from 'react';
import { Input } from '~/components/ui/input';
import { MultiSelect } from '~/components/ui/multiselect';
export const loader = async ({ params, request }: LoaderArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: `/auth/?returnTo=${encodeURI(
      new URL(request.url).pathname,
    )}`,
  });

  const drive = await getDriveNotifications({ id: params.driveId });
  if (!drive) {
    throw new Response('Not Found', { status: 404 });
  }

  return json({ drive });
};

const notifications = [
  {
    value: 'email',
    label: 'Email Analytics',
  },
  {
    value: 'email',
    label: 'Email Christopher',
  },
  {
    value: 'telegram',
    label: 'Telegram',
  },
];

export default function Index() {
  const { drive } = useLoaderData<typeof loader>();
  let { serverId } = useParams();

  const [perc, setPerc] = useState(false);
  const [size, setSize] = useState(false);
  const [growth, setGrowth] = useState(false);
  const [missing, setMissing] = useState(false);

  return (
    <>
      <Link
        to={`/servers/${serverId}/drives/${drive.id}`}
        className="flex content-center space-x-2 pb-4 text-slate-600"
        prefetch="intent"
      >
        <MoveLeft size={16} className="my-auto" />
        <span className="my-auto">
          Back to{' '}
          <strong>
            {drive.name}:\{drive.location}
          </strong>
        </span>
      </Link>
      <H1>
        Notifications for {drive.name}:\{drive.location}
      </H1>
      <div className="space-y-4">
        <div className=" rounded-lg border p-4 max-w-[500px]">
          <div className="space-y-2">
            <H3 className="text-2xl">General</H3>
            <div className="text-muted-foreground pb-2">
              Recieve notification when drive dissapears.
            </div>
            <Separator />
            <div
              className={`space-x-6 flex flex-row items-center justify-between transition-colors ${
                missing ? '' : 'opacity-50 text-slate-600'
              }`}
            >
              <div className="flex-grow">
                <Label className="text-base">Missing</Label>
                <div className="text-muted-foreground pb-2">
                  When server is online but the drive is not found.
                </div>
                <Collapsible open={missing}>
                  <CollapsibleContent className="space-y-2">
                    <MultiSelect
                      label="Notification Methods"
                      placeholder="choose"
                      data={notifications}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
              <div className="self-start pt-3">
                <Switch checked={missing} onCheckedChange={setMissing} />
              </div>
            </div>
          </div>
        </div>
        <div className=" rounded-lg border p-4 max-w-[500px]">
          <div className="space-y-2">
            <H3 className="text-2xl">Free Space</H3>
            <div className="text-muted-foreground pb-2">
              Recieve notification when free space meets certain criteria.
            </div>
            <Separator />
            <div
              className={`space-x-6 flex flex-row items-center justify-between transition-colors ${
                perc ? '' : 'opacity-50 text-slate-600'
              }`}
            >
              <div className="flex-grow">
                <Label className="text-base">Percentage</Label>
                <div className="text-muted-foreground pb-2">
                  When free space falls below a percentage (%).
                </div>
                <Collapsible open={perc}>
                  <CollapsibleContent className="space-y-2">
                    <div>
                      <Label className="text-slate-700">Percentage</Label>
                      <Input type="number" placeholder="10" />
                    </div>
                    <MultiSelect
                      label="Notification Methods"
                      placeholder="choose"
                      data={notifications}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
              <div className="self-start  pt-3">
                <Switch checked={perc} onCheckedChange={setPerc} />
              </div>
            </div>
            <Separator />
            <div
              className={`space-x-6 flex flex-row items-center justify-between transition-colors  ${
                size ? '' : 'opacity-50 text-slate-600'
              }`}
            >
              <div className="flex-grow">
                <Label className="text-base">Fixed Size</Label>
                <div className="text-muted-foreground pb-2">
                  When free space falls below a specific size (GB).
                </div>
                <Collapsible open={size}>
                  <CollapsibleContent className="space-y-2">
                    <div>
                      <Label className="text-slate-700">GB</Label>
                      <Input type="number" placeholder="10" />
                    </div>
                    <MultiSelect
                      label="Notification Methods"
                      placeholder="choose"
                      data={notifications}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
              <div className="self-start pt-3">
                <Switch checked={size} onCheckedChange={setSize} />
              </div>
            </div>
            <div></div>
          </div>
        </div>

        <div className=" rounded-lg border p-4 max-w-[500px]">
          <div className="space-y-2">
            <H3 className="text-2xl">Growth</H3>
            <div className="text-muted-foreground pb-2">
              Recieve notification when drive grows at a specified rate.
            </div>
            <Separator />
            <div
              className={`space-x-6 flex flex-row items-center justify-between transition-colors ${
                growth ? '' : 'opacity-50 text-slate-600'
              }`}
            >
              <div className="flex-grow">
                <div className="text-muted-foreground py-2">
                  When growth rate is greater than x GB/day.
                </div>
                <Collapsible open={growth}>
                  <CollapsibleContent className="space-y-2">
                    <div>
                      <Label className="text-slate-700">GB</Label>
                      <Input type="number" placeholder="10" />
                    </div>
                    <MultiSelect
                      label="Notification Methods"
                      placeholder="choose"
                      data={notifications}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
              <div className="self-start pt-2">
                <Switch checked={growth} onCheckedChange={setGrowth} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
