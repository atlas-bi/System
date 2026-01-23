import '@testing-library/cypress/add-commands';

import { faker } from '@faker-js/faker';

function login({
	email = faker.internet.email(undefined, undefined, 'example.com'),
}: {
	email?: string;
} = {}) {
	cy.then(() => ({ email })).as('user');
	cy.exec(
		`pnpm exec ts-node -P cypress/tsconfig.json --require tsconfig-paths/register ./cypress/support/create-user.ts "${email}"`,
	).then(({ stdout }) => {
		const cookieValue = stdout
			.replace(/.*<cookie>(?<cookieValue>.*)<\/cookie>.*/s, '$<cookieValue>')
			.trim();
		cy.setCookie('__session', cookieValue);
	});
	return cy.get('@user');
}

function deleteUserByEmail(email: string) {
	cy.exec(
		`pnpm exec ts-node -P cypress/tsconfig.json --require tsconfig-paths/register ./cypress/support/delete-user.ts "${email}"`,
		{ failOnNonZeroExit: false },
	);
	cy.clearCookie('__session');
}

function cleanupUser({ email }: { email?: string } = {}) {
	if (email) {
		deleteUserByEmail(email);
	} else {
		cy.get('@user').then((user) => {
			const email = (user as { email?: string }).email;
			if (email) {
				deleteUserByEmail(email);
			}
		});
	}
	cy.clearCookie('__session');
}

function visitAndCheck(url: string, waitTime: number = 1000) {
	cy.visit(url);
	cy.location('pathname').should('contain', url).wait(waitTime);
}

Cypress.Commands.add('login', login);
Cypress.Commands.add('cleanupUser', cleanupUser);
Cypress.Commands.add('visitAndCheck', visitAndCheck);

Cypress.on('uncaught:exception', (err) => {
	// Cypress and React Hydrating the document don't get along
	// for some unknown reason. Hopefully we figure out why eventually
	// so we can remove this.
	if (
		/hydrat/i.test(err.message) ||
		/Minified React error #418/.test(err.message) ||
		/Minified React error #423/.test(err.message)
	) {
		return false;
	}
});
