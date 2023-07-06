import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Outlet, useLoaderData } from '@remix-run/react';
import { namedAction } from 'remix-utils';
import invariant from 'tiny-invariant';
import { SidebarNav } from '~/components/drive_sidebar';
import { Separator } from '~/components/ui/separator';
import {
  deleteServer,
  getServer,
  getServerDrives,
} from '~/models/server.server';
import { authenticator } from '~/services/auth.server';

export const loader = async ({ params, request }: LoaderArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: `/auth/?returnTo=${encodeURI(
      new URL(request.url).pathname,
    )}`,
  });

  invariant(params.serverId, 'serverId not found');

  const server = await getServer({ id: params.serverId });
  if (!server) {
    throw new Response('Not Found', { status: 404 });
  }
  const drives = await getServerDrives({ serverId: params.serverId });

  if (!params.driveId && drives.length > 0) {
    return redirect(`/servers/${params.serverId}/drives/${drives[0].id}`);
  }
  return json({ drives, server });
};

export async function action({ params, request }: ActionArgs) {
  return namedAction(request, {
    async delete() {
      // do create
      invariant(params.serverId, 'serverId not found');
      await deleteServer({ id: params.serverId });
      return redirect('/');
    },
  });
}

export default function Index() {
  const { drives, server } = useLoaderData<typeof loader>();

  return (
    <>
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">{server.title}</h2>
        <p className="text-muted-foreground">
          Server details for {server.title}.
        </p>
      </div>
      <Separator className="my-6" />
      <h5>Name: {server.name}</h5>
      <h5>Title: {server.title}</h5>

      <h5>token: {server.token}</h5>
      <h5>caption: {server.caption}</h5>
      <h5>name: {server.name}</h5>
      <h5>dnsHostName: {server.dnsHostName}</h5>
      <h5>domain: {server.domain}</h5>
      <h5>manufacturer: {server.manufacturer}</h5>
      <h5>model: {server.model}</h5>
      <h5>systemFamily: {server.systemFamily}</h5>
      <h5>systemSkuNumber: {server.systemSkuNumber}</h5>
      <h5>systemType: {server.systemType}</h5>
      <h5>totalPhysicalMemory: {server.totalPhysicalMemory}</h5>
      <h5>serverName: {server.serverName}</h5>
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SidebarNav items={drives} />
        </aside>
        <div className="flex-1 lg:max-w-2xl">
          <Outlet />
        </div>
      </div>
      <Form method="post">
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Delete
        </button>
      </Form>
    </>
  );
}
