import { encrypt } from '@/lib/utils';
import type { Server, ServerLogs, User } from '@prisma/client';
import { prisma } from '~/db.server';
import monitorServer from '~/queues/monitor.server';

export type { Server } from '@prisma/client';

export function getServer({ id }: Pick<Server, 'id'>) {
  return prisma.server.findFirst({
    where: { id },
  });
}

export function serverError({ id }: Pick<Server, 'id'>) {
  return prisma.server.update({
    where: { id },
    data: {
      hasError: true,
    },
  });
}

export function serverLog({
  serverId,
  type,
  message,
}: Pick<ServerLogs, 'serverId' | 'type' | 'message'>) {
  return prisma.serverLogs.create({
    data: { serverId, type, message },
  });
}

export function getDrive({ id, serverId }: Pick<Drive, 'id', 'serverId'>) {
  return prisma.drive.findFirst({
    where: { id },
    select: {
      id: true,
      serverId: true,
      location: true,
      inactive: true,
      name: true,
      description: true,
      maximumSize: true,
      usage: {
        select: {
          id: true,
          free: true,
          used: true,
          createdAt: true,
        },
        take: 60,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export function getServerLogs({ serverId }: Pick<ServerLogs, 'serverId'>) {
  return prisma.serverLogs.findMany({
    where: {
      serverId,
      NOT: {
        message: {
          contains: 'clientVersion',
          mode: 'insensitive',
        },
      },
    },
    take: 10,
  });
}

export function getServerDrives({ serverId }: { serverId: Server['id'] }) {
  return prisma.drive.findMany({
    where: { serverId },
    select: {
      id: true,
      serverId: true,
      location: true,
      inactive: true,
      name: true,
      description: true,
      maximumSize: true,
      size: true,
      daysTillFull: true,
      growthRate: true,
      usage: {
        select: {
          id: true,
          free: true,
          used: true,
        },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function createServer({
  title,
  host,
  username,
  password,
  privateKey,
  port,
  type,
}: Pick<
  Server,
  'title' | 'port' | 'privateKey' | 'username' | 'password' | 'host' | 'type'
>) {
  const server = await prisma.server.create({
    data: {
      title,
      host,
      username,
      password: password ? encrypt(password) : undefined,
      privateKey: privateKey ? encrypt(privateKey) : undefined,
      port,
      type,
    },
  });
  // check server as soon as it is added
  monitorServer.enqueue(server.id);
  return server;
}

export function deleteServer({ id }: Pick<Server, 'id'>) {
  return prisma.server.deleteMany({
    where: { id },
  });
}

export function getEnabledServers() {
  return prisma.server.findMany({
    where: {
      enabled: true,
    },
    select: {
      id: true,
    },
  });
}

export function getServers() {
  return prisma.server.findMany({
    select: {
      id: true,
      title: true,
      host: true,
      caption: true,
      name: true,
      dnsHostName: true,
      domain: true,
      manufacturer: true,
      model: true,
      os: true,
      osVersion: true,
      enabled: true,
      type: true,
      hasError: true,
    },
    orderBy: [
      {
        hasError: 'desc',
      },
      {
        title: 'asc',
      },
    ],
  });
}

export function updateServer({
  id,
  data,
  drives,
}: Pick<Server, 'id'> & {
  data: {
    caption?: string;
    name?: string;
    dnsHostName?: string;
    domain?: string;
    manufacturer?: string;
    model?: string;
    os?: string;
    osVersion?: string;
  };
  drives: {
    data: {
      location?: string;
      name?: string;
      root?: string;
      description?: string;
      maximumSize?: string;
      size: string;
    };
    used?: string;
    free?: string;
  }[];
}) {
  let lastWeek = new Date();
  lastWeek = new Date(lastWeek.setDate(lastWeek.getDate() - 7));

  return prisma.server.update({
    where: { id },
    data: {
      ...data,
      hasError: false,
      drives: {
        upsert: drives.map((drive) => {
          return {
            update: {
              ...drive.data,
              usage: {
                create: {
                  used: drive.used,
                  free: drive.free,
                },
              },
            },
            create: {
              ...drive.data,
              usage: {
                create: {
                  used: drive.used,
                  free: drive.free,
                },
              },
            },
            where: {
              serverId_name: {
                name: drive.data.name,
                serverId: id,
              },
            },
          };
        }),
      },
    },
    select: {
      drives: {
        select: {
          id: true,
          size: true,
          usage: {
            where: {
              createdAt: {
                // new Date() creates date with current time and day and etc.
                gte: lastWeek,
              },
            },
            select: {
              id: true,
              used: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      },
    },
  });
}

export function setDriveDays({
  id,
  daysTillFull,
}: Pick<Drive, 'id' | 'daysTillFull'>) {
  return prisma.drive.update({
    where: { id },
    data: { daysTillFull },
  });
}

export function setDriveGrowth({
  id,
  growthRate,
}: Pick<Drive, 'id' | 'growthRate'>) {
  return prisma.drive.update({
    where: { id },
    data: { growthRate },
  });
}

// export function updateDrive
