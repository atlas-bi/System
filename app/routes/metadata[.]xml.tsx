import { metadata } from '~/services/auth.server';

export const loader = async () => {
  return new Response(metadata, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
  });
};
