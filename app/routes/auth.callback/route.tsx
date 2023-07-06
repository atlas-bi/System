import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { authenticator } from '~/services/auth.server';

export const action: ActionFunction = ({ request }) => login(request);
export const loader: LoaderFunction = ({ request }) => login(request);

async function login(request: Request) {
  let successRedirect = '/';

  try {
    // if relay state was set we can redirect to it.
    const newRequest = request.clone();
    const formData = await newRequest.formData();
    const body = Object.fromEntries(formData);
    successRedirect = (formData.get('RelayState') || '/').toString();
  } catch (e) {}

  // call authenticate to complete the login and set returnTo as the
  successRedirect;
  // in the access-denied we should have a button to try ldap login
  return authenticator.authenticate('saml', request, {
    successRedirect,
    failureRedirect: '/access-denied',
  });
}
