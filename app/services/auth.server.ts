import * as validator from '@authenio/samlify-node-xmllint';
import { Authenticator } from 'remix-auth';
import { FormStrategy } from 'remix-auth-form';
import { SamlStrategy } from 'remix-auth-saml';
import invariant from 'tiny-invariant';
import { SlimUserFields, updateUserProps } from '~/models/user.server';
import { sessionStorage } from '~/services/session.server';

import { verifyLogin } from './ldap.server';

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export const authenticator = new Authenticator<SlimUserFields>(sessionStorage);

const host = process.env.HOSTNAME;

let metadata;

if (process.env.SAML_IDP_METADATA) {
	try {
		invariant(host, 'HOSTNAME is required for saml.');

		const samlStrategy = new SamlStrategy(
			{
				validator,
				authURL: host,
				callbackURL: host + '/auth/callback',
				idpMetadataURL: process.env.SAML_IDP_METADATA,
				spAuthnRequestSigned:
					(process.env.SAML_SP_AUTHNREQUESTSSIGNED || '').toLowerCase() ===
					'true',
				spWantAssertionSigned:
					(process.env.SAML_SP_WANTASSERTIONSIGNED || '').toLowerCase() ===
					'true',
				spWantMessageSigned:
					(process.env.SAML_SP_WANTMESSAGESIGNED || '').toLowerCase() ===
					'true',
				spWantLogoutRequestSigned:
					(process.env.SAML_SP_WANTLOGOUTRESPONSESIGNED || '').toLowerCase() ===
					'true',
				spWantLogoutResponseSigned:
					(process.env.SAML_SP_WANTLOGOUTREQUESTSIGNED || '').toLowerCase() ===
					'true',
				spIsAssertionEncrypted:
					(process.env.SAML_SP_ISASSERTIONENCRYPTED || '').toLowerCase() ===
					'true',
				// optional
				privateKey: process.env.SAML_PRIVATE_KEY,
				// optional
				privateKeyPass: process.env.SAML_PRIVATE_KEY_PASS,
				// optional
				encPrivateKey: process.env.SAML_ENC_PRIVATE_KEY,
				signingCert: process.env.SAML_SIGNING_CERT,
				encryptCert: process.env.SAML_ENC_CERT,
			},
			async ({ extract, data }) => {
				if (!extract.nameID) {
					throw 'failed to login.';
				}
				const email = extract.nameID;

				if (process.env.SAML_AUTH_GROUP) {
					if (
						!extract.attributes?.groups ||
						extract.attributes.groups.indexOf(process.env.SAML_AUTH_GROUP) == -1
					) {
						throw 'missing required groups.';
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

		authenticator.use(samlStrategy, 'saml');
		metadata = samlStrategy.metadata();
	} catch (e) {
		if (process.env.NODE_ENV === 'production') console.log(e);
	}
}
// use ldap

const ldapStrategy = new FormStrategy(async ({ form }) => {
	const email = form.get('email') as string;
	const password = form.get('password') as string;
	const user = await verifyLogin(email, password);
	if (!user) throw 'failed to login.';
	return user;
});

authenticator.use(ldapStrategy, 'ldap');

export { metadata };
