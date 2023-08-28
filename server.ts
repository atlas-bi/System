/* eslint-disable remix/node-server-imports */
import { createRequestHandler } from '@remix-run/express';
import compression from 'compression';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { spawn, spawnSync } from 'child_process';
/*

1. start quirrel
2. get token
3. load ci jobs
4. start remix

note: find missing processes
lsof -i :9181
kill -9 <<PID>>

*/

const port = process.env.PORT || 3000;
const app = express();
const MODE = process.env.NODE_ENV;
const BUILD_DIR = path.join(process.cwd(), 'build');

const child = spawn(
	'node',
	[`${process.cwd()}/node_modules/quirrel/dist/cjs/src/api/main.js`],
	{ env: { ...process.env, PORT: process.env.QUIRREL_PORT || 9891 } },
);
// const child = spawn('ls', {cwd: process.cwd()});
child.on('exit', function (code, signal, message) {
	throw Error(
		'child process exited with ' +
			`code ${code} and signal ${signal} ${message}`,
	);
});

child.stdout.on('data', (data) => {
	console.log(`quirrel: ${data}`);
});
child.stderr.on('data', (data) => {
	console.log(`quirrel error: ${data}`);
});

(async () => {
	console.log('getting token!');

	const sleep = (ms) => {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	};

	const fetchWithRetries = async (url, options, retryCount = 0) => {
		// split out the maxRetries option from the remaining
		// options (with a default of 3 retries)
		if (retryCount > 0) console.log(`retry ${retryCount}...`);
		const { maxRetries = 3, ...remainingOptions } = options;
		let response;
		try {
			response = await fetch(url, remainingOptions);
			if (response.status !== 201) {
				const x = await response.text();
				console.log(x);
				throw Error(response.status.toString());
			}
			return response;
		} catch (error) {
			// if the retryCount has not been exceeded, call again
			console.log(error);
			if (retryCount < maxRetries) {
				await sleep(5000);
				return fetchWithRetries(url, options, retryCount + 1);
			}
			console.log('Failed to connect to quirrel: max retries exceeded');
			// max retries exceeded
			child.kill('SIGINT');
			throw error;
		}
	};

	const response = await fetchWithRetries(
		`http://localhost:${process.env.QUIRREL_PORT || 9181}/tokens/prod`,
		{
			method: 'PUT',
			headers: {
				Authorization:
					'Basic ' + btoa('ignored:' + process.env.QUIRREL_PROCESS),
			},
			maxRetries: 5,
		},
	);
	process.env.QUIRREL_TOKEN = await response.text();

	// load cron jobs
	console.log('Quirrel: loading cron jobs');
	const ci = spawnSync(
		'node',
		[`${process.cwd()}/node_modules/.bin/dotenv`, 'quirrel', 'ci'],
		{
			env: {
				...process.env,
				PORT: process.env.QUIRREL_PORT || 9891,
			},
			stdio: 'inherit',
			encoding: 'utf-8',
		},
	);

	app.listen(port, () => {
		// require the built app so we're ready when the first request comes in
		console.log(process.env.QUIRREL_TOKEN);
		require(BUILD_DIR);
		console.log(`✅ app ready: http://localhost:${port}`);
	});
})();

/* end of quirrel */

app.use((req, res, next) => {
	// helpful headers:
	res.set('x-fly-region', process.env.FLY_REGION ?? 'unknown');
	res.set('Strict-Transport-Security', `max-age=${60 * 60 * 24 * 365 * 100}`);

	// /clean-urls/ -> /clean-urls
	if (req.path.endsWith('/') && req.path.length > 1) {
		const query = req.url.slice(req.path.length);
		const safepath = req.path.slice(0, -1).replace(/\/+/g, '/');
		res.redirect(301, safepath + query);
		return;
	}
	next();
});

// if we're not in the primary region, then we need to make sure all
// non-GET/HEAD/OPTIONS requests hit the primary region rather than read-only
// Postgres DBs.
// learn more: https://fly.io/docs/getting-started/multi-region-databases/#replay-the-request
app.all('*', function getReplayResponse(req, res, next) {
	const { method, path: pathname } = req;
	const { PRIMARY_REGION, FLY_REGION } = process.env;

	const isMethodReplayable = !['GET', 'OPTIONS', 'HEAD'].includes(method);
	const isReadOnlyRegion =
		FLY_REGION && PRIMARY_REGION && FLY_REGION !== PRIMARY_REGION;

	const shouldReplay = isMethodReplayable && isReadOnlyRegion;

	if (!shouldReplay) return next();

	const logInfo = {
		pathname,
		method,
		PRIMARY_REGION,
		FLY_REGION,
	};
	console.info(`Replaying:`, logInfo);
	res.set('fly-replay', `region=${PRIMARY_REGION}`);
	return res.sendStatus(409);
});

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

// Remix fingerprints its assets so we can cache forever.
app.use(
	'/build',
	express.static('public/build', { immutable: true, maxAge: '1y' }),
);

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static('public', { maxAge: '1h' }));

app.use(morgan('tiny'));

app.all(
	'*',
	MODE === 'production'
		? createRequestHandler({ build: require(BUILD_DIR) })
		: (...args) => {
				purgeRequireCache();
				const requestHandler = createRequestHandler({
					build: require(BUILD_DIR),
					mode: MODE,
				});
				return requestHandler(...args);
		  },
);

function purgeRequireCache() {
	// purge require cache on requests for "server side HMR" this won't let
	// you have in-memory objects between requests in development,
	// alternatively you can set up nodemon/pm2-dev to restart the server on
	// file changes, we prefer the DX of this though, so we've included it
	// for you by default
	for (const key in require.cache) {
		if (key.startsWith(BUILD_DIR)) {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete require.cache[key];
		}
	}
}
