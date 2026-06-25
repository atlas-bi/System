import { cssBundleHref } from "@remix-run/css-bundle";
import stylesheet from "@/styles/globals.css";
import { LinksFunction, MetaFunction } from "@remix-run/node";
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	isRouteErrorResponse,
	useRouteError,
} from "@remix-run/react";

// import remixImageStyles from 'remix-image/remix-image.css';
import { H1 } from "./components/ui/typography";
import { MoveLeft } from "lucide-react";

export const links: LinksFunction = () => [
	{ rel: "stylesheet", href: stylesheet },
	...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const meta: MetaFunction = () => [{ title: "Atlas System" }];

function ErrorBackButton() {
	return (
		<button
			type="button"
			className="flex space-x-2"
			onClick={() => {
				if (window.history.length > 1) {
					window.history.back();
				} else {
					window.location.assign("/");
				}
			}}
		>
			<MoveLeft size={16} className="my-auto" />
			<span>Go back</span>
		</button>
	);
}

export default function App() {
	return (
		<html lang="en" className="h-full">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="h-full">
				<Outlet />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();

	let message = <h1>Unknown Error</h1>;
	if (isRouteErrorResponse(error)) {
		message = (
			<div className="space-y-4">
				<H1>
					{error.status} {error.statusText}
				</H1>
				<p className="text-sm">{error.data}</p>
			</div>
		);
	} else if (error instanceof Error) {
		message = (
			<div className="space-y-4">
				<ErrorBackButton />
				<H1>Error</H1>
				<p className="text-sm">{error.message}</p>
				{error.stack && (
					<>
						<strong>The stack trace is:</strong>
						<pre className="text-sm">{error.stack}</pre>
					</>
				)}
			</div>
		);
	}
	return (
		<html lang="en" className="h-full">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="h-full">
				<div className="container pt-4">
					<div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
						{message}
						<Outlet />
					</div>
				</div>
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
