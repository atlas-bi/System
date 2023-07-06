import type { ActionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { NodeSSH } from 'node-ssh';
import { namedAction } from 'remix-utils';
import { createServer } from '~/models/server.server';
import { authenticator } from '~/services/auth.server';

const isNullOrEmpty = (str: string | undefined | FormDataEntryValue) => {
  if (str === undefined || str === null || str.toString().trim() === '') {
    return true;
  }
  return false;
};

export async function action({ request }: ActionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: `/auth/?returnTo=${encodeURI(
      new URL(request.url).pathname,
    )}`,
  });

  return namedAction(request, {
    async new() {
      const formData = await request.formData();
      const { _action, ...values } = Object.fromEntries(formData);

      if (isNullOrEmpty(values.name)) {
        return json({ form: { error: 'Name is required.' } });
      }

      if (isNullOrEmpty(values.host)) {
        return json({ form: { error: 'Host is required.' } });
      }

      if (isNullOrEmpty(values.username)) {
        return json({ form: { error: 'Username is required.' } });
      }

      if (isNullOrEmpty(values.password) && isNullOrEmpty(values.privateKey)) {
        return json({
          form: { error: 'Password or Private Key is required.' },
        });
      }

      await createServer({
        title: values.name.toString(),
        host: values.host.toString(),
        username: values.username.toString(),
        password: values.password ? values.password.toString() : undefined,
        privateKey: values.privateKey
          ? values.privateKey.toString()
          : undefined,
        port: (values.port || 22).toString(),
      });

      return json({ success: 'Server Created' });
    },
    async test() {
      const formData = await request.formData();
      const { _action, ...values } = Object.fromEntries(formData);

      if (isNullOrEmpty(values.name)) {
        return json({ form: { error: 'Name is required.' } });
      }

      if (isNullOrEmpty(values.host)) {
        return json({ form: { error: 'Host is required.' } });
      }

      if (isNullOrEmpty(values.username)) {
        return json({ form: { error: 'Username is required.' } });
      }

      if (isNullOrEmpty(values.password) && isNullOrEmpty(values.privateKey)) {
        return json({
          form: { error: 'Password or Private Key is required.' },
        });
      }

      const ssh = new NodeSSH();

      try {
        await ssh.connect({
          ...values,
        });
      } catch (e) {
        return json({ error: e });
      }
      return json({ success: 'Connection Successful' });
    },
  });
}
