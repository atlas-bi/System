import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticateWithSaml, hasSamlStrategy } from "~/services/auth.server";
import { safeRedirect } from "~/utils";

export const action: ActionFunction = ({ request }) => login(request);
export const loader: LoaderFunction = ({ request }) => login(request);

async function login(request: Request) {
	if (hasSamlStrategy()) {
		return authenticateWithSaml(request);
	} else {
		const url = new URL(request.url);
		const returnTo = safeRedirect(url.searchParams.get("returnTo") || "/");
		return redirect(`/login?returnTo=${encodeURI(returnTo)}`);
	}
}
