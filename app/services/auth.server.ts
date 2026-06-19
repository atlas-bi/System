import * as validator from "@authenio/samlify-node-xmllint";
import { redirect } from "@remix-run/node";
import { Authenticator } from "remix-auth";
import { Strategy } from "remix-auth/strategy";
import { FormStrategy } from "remix-auth-form";
import { SamlStrategy } from "remix-auth-saml";
import fs from "node:fs";
import invariant from "tiny-invariant";
import { SlimUserFields, updateUserProps } from "~/models/user.server";
import { sessionStorage } from "~/services/session.server";

import { verifyLogin } from "./ldap.server";

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export const authenticator = new Authenticator<SlimUserFields>();

const sessionKey = "user";
export const sessionErrorKey = "auth:error";
const sessionStrategyKey = "strategy";

type AuthenticateOptions = {
	successRedirect?: string;
	failureRedirect?: string;
	headers?: HeadersInit;
};

export function authenticate(
	request: Request,
	options: {
		failureRedirect: string;
		successRedirect?: string;
		headers?: HeadersInit;
	},
): Promise<SlimUserFields>;
export function authenticate(
	request: Request,
	options: {
		successRedirect: string;
		failureRedirect?: string;
		headers?: HeadersInit;
	},
): Promise<null>;
export function authenticate(
	request: Request,
	options?: AuthenticateOptions,
): Promise<SlimUserFields | null>;
export async function authenticate(
	request: Request,
	options: AuthenticateOptions = {},
) {
	const session = await sessionStorage.getSession(
		request.headers.get("Cookie"),
	);
	const user = session.get(sessionKey) ?? null;

	if (user) {
		if (options.successRedirect) {
			throw redirect(options.successRedirect, { headers: options.headers });
		}
		return user as SlimUserFields;
	}

	if (options.failureRedirect) {
		throw redirect(options.failureRedirect, { headers: options.headers });
	}

	return null;
}

async function createUserSession(
	request: Request,
	user: SlimUserFields,
	redirectTo: string,
	strategy: string,
) {
	const session = await sessionStorage.getSession(
		request.headers.get("Cookie"),
	);
	session.set(sessionKey, user);
	session.set(sessionStrategyKey, strategy);
	return redirect(redirectTo, {
		headers: {
			"Set-Cookie": await sessionStorage.commitSession(session),
		},
	});
}

async function createAuthFailure(
	request: Request,
	message: string,
	redirectTo: string,
) {
	const session = await sessionStorage.getSession(
		request.headers.get("Cookie"),
	);
	session.flash(sessionErrorKey, { message });
	return redirect(redirectTo, {
		headers: {
			"Set-Cookie": await sessionStorage.commitSession(session),
		},
	});
}

export async function authenticateWithLdap(
	request: Request,
	{
		successRedirect,
		failureRedirect,
	}: {
		successRedirect: string;
		failureRedirect: string;
	},
) {
	try {
		const user = await authenticator.authenticate("ldap", request);
		return createUserSession(request, user, successRedirect, "ldap");
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to login";
		return createAuthFailure(request, message, failureRedirect);
	}
}

class SamlStrategyAdapter extends Strategy<SlimUserFields, never> {
	name: string;

	constructor(private strategy: SamlStrategy<SlimUserFields>) {
		super(async () => {
			throw new Error("SAML verification is handled by the wrapped strategy.");
		});
		this.name = strategy.name;
	}

	authenticate(request: Request) {
		return this.strategy.authenticate(request, sessionStorage, {
			name: "saml",
			sessionKey,
			sessionErrorKey,
			sessionStrategyKey,
		});
	}
}

let configuredSamlStrategy: SamlStrategy<SlimUserFields> | undefined;

export function hasSamlStrategy() {
	return configuredSamlStrategy !== undefined;
}

export async function authenticateWithSaml(
	request: Request,
	options: {
		successRedirect?: string;
		failureRedirect?: string;
	} = {},
) {
	invariant(configuredSamlStrategy, "SAML strategy is not configured.");

	return configuredSamlStrategy.authenticate(request, sessionStorage, {
		...options,
		name: "saml",
		sessionKey,
		sessionErrorKey,
		sessionStrategyKey,
	});
}

const host = process.env.HOSTNAME;

let metadata: string | undefined;

function maybeReadPemFromEnv(value: string | undefined) {
	if (!value) return undefined;
	if (value.includes("BEGIN")) return value;
	if (fs.existsSync(value)) {
		return fs.readFileSync(value, "utf8");
	}
	return undefined;
}

if (process.env.SAML_IDP_METADATA) {
	try {
		invariant(host, "HOSTNAME is required for saml.");

		const samlStrategy = new SamlStrategy(
			{
				validator,
				authURL: host,
				callbackURL: host + "/auth/callback",
				idpMetadataURL: process.env.SAML_IDP_METADATA,
				spAuthnRequestSigned:
					(process.env.SAML_SP_AUTHNREQUESTSSIGNED || "").toLowerCase() ===
					"true",
				spWantAssertionSigned:
					(process.env.SAML_SP_WANTASSERTIONSIGNED || "").toLowerCase() ===
					"true",
				spWantMessageSigned:
					(process.env.SAML_SP_WANTMESSAGESIGNED || "").toLowerCase() ===
					"true",
				spWantLogoutRequestSigned:
					(process.env.SAML_SP_WANTLOGOUTRESPONSESIGNED || "").toLowerCase() ===
					"true",
				spWantLogoutResponseSigned:
					(process.env.SAML_SP_WANTLOGOUTREQUESTSIGNED || "").toLowerCase() ===
					"true",
				spIsAssertionEncrypted:
					(process.env.SAML_SP_ISASSERTIONENCRYPTED || "").toLowerCase() ===
					"true",
				// optional
				privateKey: maybeReadPemFromEnv(process.env.SAML_PRIVATE_KEY),
				// optional
				privateKeyPass: process.env.SAML_PRIVATE_KEY_PASS,
				// optional
				encPrivateKey: maybeReadPemFromEnv(process.env.SAML_ENC_PRIVATE_KEY),
				signingCert: maybeReadPemFromEnv(process.env.SAML_SIGNING_CERT),
				encryptCert: maybeReadPemFromEnv(process.env.SAML_ENC_CERT),
			},
			async ({ extract, data }) => {
				if (!extract.nameID) {
					throw "failed to login.";
				}
				const email = extract.nameID;

				if (process.env.SAML_AUTH_GROUP) {
					if (
						!extract.attributes?.groups ||
						extract.attributes.groups.indexOf(process.env.SAML_AUTH_GROUP) == -1
					) {
						throw "missing required groups.";
					}
				}

				return updateUserProps(
					email,
					extract.attributes?.firstName,
					extract.attributes?.lastName,
					extract.attributes?.groups,
					extract.attributes?.profilePhoto,
				);
			},
		);

		configuredSamlStrategy = samlStrategy;
		authenticator.use(new SamlStrategyAdapter(samlStrategy), "saml");
		metadata = samlStrategy.metadata();
	} catch (e) {
		if (process.env.NODE_ENV === "production") console.log(e);
	}
}
// use ldap

const ldapStrategy = new FormStrategy(async ({ form }) => {
	const email = form.get("email") as string;
	const password = form.get("password") as string;
	const user = await verifyLogin(email, password);
	if (!user) throw "failed to login.";
	return user;
});

authenticator.use(ldapStrategy, "ldap");

export { createUserSession, metadata };
