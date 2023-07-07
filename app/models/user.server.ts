import type { Group, User } from '@prisma/client';
import slugify from 'slugify';
import invariant from 'tiny-invariant';
import { prisma } from '~/db.server';

const userIndex = 'atlas-requests-users';

export type SlimUserFields = {
  id: number;
  email: string;
  lastName: string | null;
  firstName: string | null;
  slug: string;
};

// used for the auth user
const slimUserFields = {
  id: true,
  email: true,
  lastName: true,
  firstName: true,
  slug: true,
};

export type FullUserFields = SlimUserFields & {
  profilePhoto: string | null;
};
export const fullUserFields = {
  ...slimUserFields,
  profilePhoto: true,
};

const slugger = (email: string) => {
  return slugify(email.substring(0, email.indexOf('@')).replace('.', '-'), {
    lower: true, // convert to lower case, defaults to `false`
    strict: true,
  });
};

export async function getUserById(id: User['id']) {
  return prisma.user.findUnique({ where: { id }, include: { groups: true } });
}

async function getUserByEmail(email: User['email']) {
  return prisma.user.findUnique({ where: { email }, select: slimUserFields });
}

function createUser(email: User['email']) {
  return prisma.user.create({
    data: {
      email,
      slug: slugger(email),
    },
    select: slimUserFields,
  });
}

function createGroup(name: Group['name']) {
  return prisma.group.create({
    data: {
      name,
    },
    select: {
      id: true,
      name: true,
    },
  });
}
function getGroupByName(name: Group['name']) {
  return prisma.group.findUnique({ where: { name } });
}

export async function getUserBySlug(slug: User['slug']) {
  return prisma.user.findUnique({ where: { slug }, select: fullUserFields });
}

async function getOrCreateGroup(name: Group['name']) {
  const group = await getGroupByName(name);

  if (group) return group;

  return createGroup(name);
}

async function getOrCreateUser(email: User['email']) {
  const user = await getUserByEmail(email);
  if (user) return user;

  return createUser(email);
}

export async function updateUserProps(
  email: User['email'],
  firstName: User['firstName'],
  lastName: User['lastName'],
  groups: Group['name'][],
  profilePhoto: User['profilePhoto'],
): Promise<SlimUserFields> {
  await getOrCreateUser(email);

  const groupModels = groups
    ? await Promise.all(groups?.map(async (group) => getOrCreateGroup(group)))
    : undefined;

  return prisma.user.update({
    where: { email },
    data: {
      firstName,
      lastName,
      profilePhoto,
      groups: {
        set: groupModels
          ? groupModels.map((group: { id: number }) => ({
              id: Number(group.id),
            }))
          : [],
      },
      slug: slugger(email),
    },
    select: slimUserFields,
  });
}
