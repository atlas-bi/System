import type { Usage } from '@prisma/client';
import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import bytes from 'bytes';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import invariant from 'tiny-invariant';
import { getDrive } from '~/models/server.server';
import { authenticator } from '~/services/auth.server';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export const options = {
  responsive: true,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  stacked: false,
  plugins: {
    title: {
      display: true,
      text: 'Storage Usage',
    },
  },
  scales: {
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      ticks: {
        callback: function (value: string) {
          return value + 'GB';
        },
      },
    },
  },
};

export const loader = async ({ params, request }: LoaderArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: `/auth/?returnTo=${encodeURI(
      new URL(request.url).pathname,
    )}`,
  });
  invariant(params.serverId, 'serverId not found');
  invariant(params.driveId, 'driveId not found');

  const drive = await getDrive({ id: params.driveId });
  if (!drive) {
    throw new Response('Not Found', { status: 404 });
  }

  return json({ drive });
};

export default function DriveDetailsPage() {
  const { drive } = useLoaderData<typeof loader>();

  const data = {
    labels: drive.usage.map((x: Usage) => x.createdAt),
    datasets: [
      {
        label: 'Free',
        data: drive.usage.map((x: Usage) =>
          bytes(Number(x.free), { unit: 'GB' }).replace('GB', ''),
        ),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Used',
        data: drive.usage.map((x: Usage) =>
          bytes(Number(x.used), { unit: 'GB' }).replace('GB', ''),
        ),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Total',
        data: drive.usage.map((x: Usage) => {
          return bytes(Number(x.used) + Number(x.free), { unit: 'GB' }).replace(
            'GB',
            '',
          );
        }),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'y',
      },
    ],
  };

  const total = Number(drive.usage?.[0]?.free) + Number(drive.usage?.[0]?.used);

  return (
    <div>
      {drive.name}

      <h4>{drive.location}</h4>
      <h4>{drive.name}</h4>
      <h4>{drive.root}</h4>
      <h4>{drive.description}</h4>
      <h4>{drive.maximumSize}</h4>
      <h4>
        {Math.round((Number(drive.usage?.[0]?.used) / total) * 100)}% used
      </h4>
      <h4>{bytes(total)} total size</h4>

      <Line options={options} data={data} />
    </div>
  );
}
