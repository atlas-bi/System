import type { User } from '@prisma/client';
import { authenticate } from 'ldap-authentication';
import invariant from 'tiny-invariant';
import { updateUserProps } from '~/models/user.server';

export type { User } from '@prisma/client';

export async function verifyLogin(
  email: User['email'],
  password: string,
): Promise<User> {
  invariant(
    process.env.LDAP_USERNAME,
    'process.env.LDAP_USERNAME is required.',
  );
  invariant(
    process.env.LDAP_PASSWORD,
    'process.env.LDAP_PASSWORD is required.',
  );
  invariant(process.env.LDAP_BASE_DN, 'process.env.LDAP_BASE_DN is required.');
  invariant(
    process.env.LDAP_EMAIL_FIELD,
    'process.env.LDAP_EMAIL_FIELD is required.',
  );
  invariant(process.env.LDAP_BASE_DN, 'process.env.LDAP_BASE_DN is required.');
  invariant(
    process.env.LDAP_USER_GROUP,
    'process.env.LDAP_USER_GROUP is required.',
  );
  invariant(
    process.env.LDAP_FIRSTNAME,
    'process.env.LDAP_FIRSTNAME is required.',
  );
  invariant(
    process.env.LDAP_LASTNAME,
    'process.env.LDAP_LASTNAME is required.',
  );
  invariant(process.env.LDAP_HOST, 'process.env.LDAP_HOST is required.');

  const options = {
    ldapOpts: {
      url: process.env.LDAP_HOST,
      includeRaw: true,
    },
    adminDn: process.env.LDAP_USERNAME,
    adminPassword: process.env.LDAP_PASSWORD,
    userPassword: password,
    userSearchBase: process.env.LDAP_BASE_DN,
    usernameAttribute: process.env.LDAP_EMAIL_FIELD,
    username: email,
    groupsSearchBase: process.env.LDAP_BASE_DN,
    groupClass: process.env.LDAP_USER_GROUP,
    // groupMemberAttribute: process.env.LDAP_GROUP_NAME,
    starttls: process.env.LDAP_START_TLS === 'true',
    attributes: [
      process.env.LDAP_PHOTO_FIELD ? process.env.LDAP_PHOTO_FIELD : '',
      process.env.LDAP_FIRSTNAME,
      process.env.LDAP_LASTNAME,
      'memberOf',
    ],
  };

  try {
    const ldapUser = await authenticate(options);
    if (!ldapUser) {
      throw 'Invalid email or password.';
    }

    let profilePhoto = null;

    if (
      process.env.LDAP_PHOTO_FIELD &&
      ldapUser[process.env.LDAP_PHOTO_FIELD]
    ) {
      try {
        //for bytestrings (8 120 99 ...)
        if (
          !isNaN(
            ldapUser[process.env.LDAP_PHOTO_FIELD]
              .toString()
              .replace(/\s*/g, ''),
          )
        ) {
          profilePhoto = Buffer.from(
            ldapUser[process.env.LDAP_PHOTO_FIELD]
              .split(' ')
              .map((e: string) => parseInt(e)),
          ).toString('base64');
        } else {
          // for binary
          profilePhoto = ldapUser[process.env.LDAP_PHOTO_FIELD];
        }
      } catch (e) {
        console.log(e);
      }
    }

    type Group = {
      cn: string;
      [key: string]: string;
    };

    // update user info
    return await updateUserProps(
      email,
      process.env.LDAP_FIRSTNAME
        ? ldapUser[process.env.LDAP_FIRSTNAME]
        : undefined,
      process.env.LDAP_LASTNAME
        ? ldapUser[process.env.LDAP_LASTNAME]
        : undefined,
      ldapUser.groups?.map((group: Group) => group.cn),
      profilePhoto,
    );
  } catch (err) {
    if (err === 'Access denied.') {
      throw 'Access denied.';
    }
    if (err.admin?.code === 'ENOTFOUND') {
      throw 'LDAP Configuration Error: LDAP server unreachable.';
    }
    if (err.admin) {
      throw 'LDAP Admin Configuration Error: ' + err.admin.lde_message;
    }
    if (err.lde_message) {
      throw 'LDAP Configuration Error: ' + err.lde_message;
    }
    throw 'Invalid email or password';
  }
}
