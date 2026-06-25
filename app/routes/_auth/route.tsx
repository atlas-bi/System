import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import Nav from "~/components/nav/Nav";
import { SidebarNav } from "~/components/sidebar";
import { getMonitorTypes } from "~/models/monitor.server";
import { SlimUserFields } from "~/models/user.server";
import { authenticate } from "~/services/auth.server";
import { commitSession, getSession } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
	const user: SlimUserFields = await authenticate(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	const session = await getSession(request);
	const monitorTypes = await getMonitorTypes();
	return json({
		headers: {
			"Set-Cookie": await commitSession(session),
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
				<div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
					<aside className="min-w-0">
						<SidebarNav />
					</aside>
					<main className="min-w-0">
						<Outlet />
					</main>
				</div>
			</div>
		</>
	);
};

export default Authed;
