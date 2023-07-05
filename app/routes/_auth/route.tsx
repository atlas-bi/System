import { Outlet } from '@remix-run/react';
import Nav from '~/components/nav/Nav';

const Authed = () => {
  return (
    <>
      <Nav />
      <div className="container pt-4">
        <Outlet />
      </div>
    </>
  );
};

export default Authed;
