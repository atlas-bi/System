// Use this to create a new user and login with that user
// Simply call this with:
// npx ts-node --require tsconfig-paths/register ./cypress/support/create-user.ts username@example.com
// and it will log out the cookie value you can use to interact with the server
// as that new user.
import { installGlobals } from "@remix-run/node";
import { parse } from "cookie";
import { getOrCreateUser } from "~/models/user.server";
import { sessionStorage } from "~/services/session.server";

installGlobals();

async function createAndLogin(email: string) {
	if (!email) {
		throw new Error("email required for login");
	}
	if (!email.endsWith("@example.com")) {
		throw new Error("All test emails must end in @example.com");
	}

	const user = await getOrCreateUser(email);
	const session = await sessionStorage.getSession();
	// remix-auth stores the user in the session (default key is 'user')
	session.set("user", user);
	const setCookieHeader = await sessionStorage.commitSession(session);
	if (!setCookieHeader) {
		throw new Error("Cookie missing from sessionStorage.commitSession");
	}
	// Output the full Set-Cookie header value (not just the cookie value)
	// Cypress will use this with cy.request({ headers: { Cookie: ... } })
	console.log(
		`
<cookie>
  ${setCookieHeader}
</cookie>
  `.trim(),
	);
}

createAndLogin(process.argv[2]);
