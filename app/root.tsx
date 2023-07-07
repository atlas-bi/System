// import { cssBundleHref } from "@remix-run/css-bundle";
import stylesheet from '@/styles/globals.css';
import { LinksFunction, MetaFunction, json } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
// import prism from 'prismjs/themes/prism.min.css';
import remixImageStyles from 'remix-image/remix-image.css';

import { authenticator } from './services/auth.server';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: remixImageStyles },
  { rel: 'stylesheet', href: stylesheet },
  // { rel: "stylesheet", href: prism }
  // ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const meta: MetaFunction = () => [{ title: 'Atlas System' }];

export default function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
