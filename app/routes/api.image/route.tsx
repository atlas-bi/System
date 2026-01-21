import type { ActionArgs, LoaderFunction } from '@remix-run/node';
import { sharpTransformer } from 'remix-image-sharp';
import { MemoryCache, imageLoader } from 'remix-image/server';

const configBase = {
  cache: new MemoryCache(),
  transformer: sharpTransformer,
};

export const loader: LoaderFunction = ({ request }: ActionArgs) => {
  const url = new URL(request.url);
  const selfUrl = process.env.HOSTNAME ?? `${url.protocol}//${url.host}`;
  return imageLoader({ ...configBase, selfUrl }, request);
};
