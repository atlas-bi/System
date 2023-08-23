import {
	type ActionArgs,
	type LoaderArgs,
	type V2_MetaFunction,
	json,
} from '@remix-run/node';
import { useSearchParams } from '@remix-run/react';
import { safeRedirect } from 'remix-utils';
import { authenticator } from '~/services/auth.server';
import { commitSession, getSession } from '~/services/session.server';
import { validateEmail } from '~/utils';

import { UserAuthForm } from './LoginForm';

export async function loader({ request }: LoaderArgs) {
	// If the user is already authenticated redirect to /dashboard directly
	await authenticator.isAuthenticated(request, {
		successRedirect: '/',
	});
	const session = await getSession(request);
	const error = session.get(authenticator.sessionErrorKey);

	session.unset(authenticator.sessionErrorKey);
	return json(
		{ error },
		{
			headers: {
				'Set-Cookie': await commitSession(session),
			},
		},
	);
}

export async function action({ request }: ActionArgs) {
	// remove session error messages
	const session = await getSession(request);
	session.unset(authenticator.sessionErrorKey);

	// validate the form before trying to login
	const formData = await request.formData();
	const email = formData.get('email') as string;
	const password = formData.get('password');

	let message = undefined;

	if (typeof password !== 'string' || password.length === 0) {
		message = 'Password is required';
	}

	if (!validateEmail(email)) {
		message = 'Email is invalid';
	}

	if (message) {
		return json(
			{ error: message },
			{
				status: 400,
				headers: {
					'Set-Cookie': await commitSession(session),
				},
			},
		);
	}

	const url = new URL(request.url);
	const returnTo = safeRedirect(url.searchParams.get('returnTo') || '/');

	return authenticator.authenticate('ldap', request, {
		successRedirect: returnTo,
		failureRedirect: '/login',
		context: { formData },
	});
}

export const meta: V2_MetaFunction = () => {
	return [
		{
			title: 'Login',
		},
	];
};

export default function Login() {
	const [searchParams] = useSearchParams();
	const returnTo = searchParams.get('returnTo') || '/';

	return (
		<div
			className="container relative hidden h-[800px] flex-col 
items-center justify-center md:grid lg:max-w-none lg:px-0"
		>
			<div className="lg:p-8">
				<div
					className="mx-auto flex w-full flex-col justify-center 
space-y-6 sm:w-[350px]"
				>
					<div className="flex flex-col space-y-2 text-center">
						<h1 className="text-2xl font-semibold tracking-tight">
							Atlas System
						</h1>
						<p className="text-sm text-muted-foreground">
							Login to enter the site.
						</p>
					</div>
					<UserAuthForm />
				</div>
			</div>
		</div>
	);
}
