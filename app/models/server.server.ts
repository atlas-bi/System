import type { Server, User } from '@prisma/client';
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

export function createServer({ title }: Pick<Server, 'title'>) {
  return prisma.server.create({
    data: {
      title,
      token: uuidv4(),
    },
  });
}

export function deleteServer({ id }: Pick<Server, 'id'>) {
  return prisma.server.deleteMany({
    where: { id },
  });
}

export function getServers() {
  return prisma.server.findMany({});
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
