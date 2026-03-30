import type { LoaderFunction } from '@remix-run/node';
import { sharpTransformer } from 'remix-image-sharp';
import { MemoryCache, imageLoader } from 'remix-image/server';

const configBase = {
  cache: new MemoryCache(),
  transformer: sharpTransformer,
};

export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url);
  const requestOrigin = `${url.protocol}//${url.host}`;
  const selfUrl =
    process.env.NODE_ENV === 'production' && process.env.HOSTNAME
      ? process.env.HOSTNAME
      : requestOrigin;
  return imageLoader({ ...configBase, selfUrl }, request);
};
