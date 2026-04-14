import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export const action = async ({ request }: ActionFunctionArgs) =>
	authenticator.logout(request, { redirectTo: "/" });

export const loader = async ({ request }: LoaderFunctionArgs) =>
	authenticator.logout(request, { redirectTo: "/" });
