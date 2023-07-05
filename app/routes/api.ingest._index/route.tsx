import { json } from '@remix-run/node';
import { Link } from '@remix-run/react';
import invariant from 'tiny-invariant';
import { getServerByToken, updateServer } from '~/models/server.server';

export async function action({ request }: ActionArgs) {
  const body = await request.json();
  console.log(body);

  invariant(request.headers.get('token'), 'token is requied.');

  const server = await getServerByToken({
    token: request.headers.get('token'),
  });
  if (!server) {
    throw json('Not Found', { status: 404 });
  }
  // console.log(server)

  await updateServer({
    id: server.id,
    data: {
      name: body.info.Name,
      dnsHostName: body.info.DNSHostName,
      domain: body.info.Domain,
      manufacturer: body.info.Manufacturer,
      model: body.info.Model,
      systemFamily: body.info.SystemFamily,
      systemSkuNumber: body.info.SystemSKUNumber,
      systemType: body.info.SystemType,
      totalPhysicalMemory: body.info.TotalPhysicalMemory.toString(),
      serverName: body.info.ServerName,
    },
    drives: body.storage.map((drive) => {
      return {
        data: {
          location: drive.CurrentLocation,
          name: drive.Name,
          root: drive.Root,
          description: drive.Description,
          maximumSize: drive.MaximumSize?.toString(),
        },
        used: drive.Used?.toString(),
        free: drive.Free?.toString(),
      };
    }),
  });

  return json('Success', { status: 200 });
}

export default function Ingest() {
  return <>Ok.</>;
}
