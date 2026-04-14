import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import invariant from "tiny-invariant";
import { getMonitorLatestFeed } from "~/models/monitor.server";
import { authenticator } from "~/services/auth.server";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	await authenticator.isAuthenticated(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});
	invariant(params.monitorId, "Monitor ID is required.");
	return json({
		feed: (await getMonitorLatestFeed({ id: params.monitorId }))?.[0],
	});
};
