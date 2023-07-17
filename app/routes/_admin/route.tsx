import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Outlet } from '@remix-run/react';
import Nav from '~/components/nav/Nav';
import { authenticator } from '~/services/auth.server';
import { commitSession, getSession } from '~/services/session.server';

export async function loader({ request }: LoaderArgs) {
	const user = await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	const session = await getSession(request.headers.get('cookie'));

	return json({
		headers: {
			'Set-Cookie': await commitSession(session),
		},
		user,
	});
}

const Authed = () => {
	return (
		<>
			<Nav />

			<div className="container pt-4">
				<div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
					<div className="flex-1">
						<Outlet />
					</div>
				</div>
			</div>
		</>
	);
};

export default Authed;
