import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';
import { namedAction } from 'remix-utils';
import { SidebarNav } from '~/components/server_sidebar';
import { createServer, getServers } from '~/models/server.server';

export const loader = async ({ request }: LoaderArgs) => {
  const servers = await getServers();
  return json({ servers });
};

export async function action({ request }: ActionArgs) {
  return namedAction(request, {
    async new() {
      const body = await request.formData();
      const server = await createServer({ title: body.get('title') });

      return redirect(`/servers/${server.id}`);
    },
  });
}

export default function Index() {
  const { servers } = useLoaderData<typeof loader>();
  return (
    <>
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SidebarNav items={servers} />
        </aside>
        <div className="flex-1 lg:max-w-2xl">
          <Outlet />
        </div>
      </div>
    </>
  );
}
