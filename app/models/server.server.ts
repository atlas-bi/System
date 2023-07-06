import { encrypt } from '@/lib/utils';
import type { Server, ServerLogs, User } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '~/db.server';

export type { Server } from '@prisma/client';

export function getServerByToken({ token }: Pick<Server, 'token'>) {
  return prisma.server.findFirst({
    where: { token },
  });
}
export function getServer({ id }: Pick<Server, 'id'>) {
  return prisma.server.findFirst({
    where: { id },
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

export function createServer({
  title,
  host,
  username,
  password,
  privateKey,
  port,
}: Pick<
  Server,
  'title' | 'port' | 'privateKey' | 'username' | 'password' | 'host'
>) {
  return prisma.server.create({
    data: {
      title,
      token: uuidv4(),
      host,
      username,
      password: password ? encrypt(password) : undefined,
      privateKey: privateKey ? encrypt(privateKey) : undefined,
      port,
    },
  });
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
      token: true,
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
              name: drive.data.name,
            },
          };
        }),
      },
    },
  });
}

// export function updateDrive
