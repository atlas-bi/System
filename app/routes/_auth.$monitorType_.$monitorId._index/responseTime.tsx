import { useFetcher } from '@remix-run/react';
import { formatInTimeZone } from 'date-fns-tz';
import { useEffect } from 'react';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '~/components/ui/tooltip';
import { MonitorFeeds } from '~/models/monitor.server';

export function PingStat({ url }: { url: string }) {
	const pingFetcher = useFetcher();

	useEffect(() => {
		const interval = setInterval(() => {
			if (document.visibilityState === 'visible') {
				pingFetcher.load(url);
			}
		}, 30 * 1000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (pingFetcher.state === 'idle' && pingFetcher.data == null) {
			pingFetcher.load(url);
		}
	}, [pingFetcher]);

	return (
		<div
			className={`transition-colors flex flex-row-reverse space-x-1 space-x-reverse my-auto`}
		>
			{pingFetcher.data?.feeds?.map((x: MonitorFeeds) => (
				<TooltipProvider key={x.id} delayDuration={20} skipDelayDuration={20}>
					<Tooltip>
						<TooltipTrigger asChild>
							<div
								className={`transition-all w-2 h-4 hover:scale-125 rounded ${
									x.hasError ? 'bg-red-300' : 'bg-emerald-600'
								}`}
							></div>
						</TooltipTrigger>
						<TooltipContent>
							<div>
								<div className="flex space-x-2">
									<div
										className={`${
											x.hasError
												? 'bg-red-300 border-red-400'
												: 'bg-emerald-600 border-emerald-700'
										} border-1 rounded h-3 w-3 my-auto`}
									></div>

									<strong>{x.ping}ms</strong>
									<span>
										{formatInTimeZone(
											x.createdAt,
											Intl.DateTimeFormat().resolvedOptions().timeZone,
											'MMM d, yyyy k:mm',
										)}
									</span>
								</div>
								{x.message && <>{x.message}</>}
							</div>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			))}
		</div>
	);
}
