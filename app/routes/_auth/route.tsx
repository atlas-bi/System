import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Outlet } from '@remix-run/react';
import Nav from '~/components/nav/Nav';
import { SidebarNav } from '~/components/sidebar';
import { getMonitorTypes } from '~/models/monitor.server';
import { UserSerialized } from '~/models/user.server';
import { authenticator } from '~/services/auth.server';
import { commitSession, getSession } from '~/services/session.server';

export async function loader({ request }: LoaderArgs) {
	const user: UserSerialized = await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	const session = await getSession(request.headers.get('cookie'));
	const monitorTypes = await getMonitorTypes();
	return json({
		headers: {
			'Set-Cookie': await commitSession(session),
		},
		user,
		monitorTypes,
	});
}

const Authed = () => {
	return (
		<>
			<Nav />

			<div className="container pt-4">
				<div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
					<aside className="-mx-4 md:w-1/5">
						<SidebarNav />
					</aside>
					<div className="flex-1">
						<Outlet />
					</div>
				</div>
			</div>
		</>
	);
};

export default Authed;
