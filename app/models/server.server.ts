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
      },
    },
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
      usage: {
        select: {
          id: true,
          free: true,
          used: true,
        },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
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
      systemFamily: true,
      systemSkuNumber: true,
      systemType: true,
      totalPhysicalMemory: true,
      serverName: true,
      enabled: true,
      type: true,
      hasError: true,
    },
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
    systemFamily?: string;
    systemSkuNumber?: string;
    systemType?: string;
    totalPhysicalMemory?: string;
    serverName?: string;
  };
  drives: {
    data: {
      location?: string;
      name?: string;
      root?: string;
      description?: string;
      maximumSize?: string;
      size: Number;
    };
    used?: string;
    free?: string;
  }[];
}) {
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
  });
}

// export function updateDrive
