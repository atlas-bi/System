import { Link, Outlet } from '@remix-run/react';

export default function Index() {
  return (
    <main className="relative min-h-screen bg-white sm:flex sm:items-center sm:justify-center">
      <Link to={`/servers/`}>Servers</Link>
      <Outlet />
    </main>
  );
}
