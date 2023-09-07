import * as React from 'react';
import { DialogProps } from '@radix-ui/react-alert-dialog';
import { cn } from '@/lib/utils';
import { Button } from '~/components/ui/button';
import {
	CommandDialogDynamic,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from '~/components/ui/command';

import { useFetcher, useNavigate } from '@remix-run/react';
import { Activity, AlertTriangle, Loader2, ToggleLeft } from 'lucide-react';
import { Badge } from '../ui/badge';

export function Search({ ...props }: DialogProps) {
	const [open, setOpen] = React.useState(false);
	const fetcher = useFetcher();

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		document.addEventListener('keydown', down);
		return () => document.removeEventListener('keydown', down);
	}, []);

	const runCommand = React.useCallback((command: () => unknown) => {
		setOpen(false);
		command();
	}, []);

	const [search, setSearch] = React.useState('');
	const navigate = useNavigate();

	React.useEffect(() => {
		if (search) {
			fetcher.submit({ search }, { method: 'get', action: '/search?index' });
		}
	}, [search]);

	return (
		<>
			<Button
				variant="outline"
				className={cn(
					'relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64',
				)}
				onClick={() => setOpen(true)}
				{...props}
			>
				<span className="inline-flex font-normal">Search...</span>
				<kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
					<span className="text-xs">⌘</span>K
				</kbd>
			</Button>
			<CommandDialogDynamic open={open} onOpenChange={setOpen}>
				<CommandInput
					placeholder="Type to search..."
					value={search}
					onValueChange={setSearch}
				/>
				<CommandList>
					{search && (
						<CommandEmpty>
							{fetcher.state === 'submitting' || fetcher.state === 'loading' ? (
								<Loader2
									className="ml-3 animate-spin text-muted-foreground"
									size={14}
								/>
							) : (
								'No results found.'
							)}
						</CommandEmpty>
					)}

					{search &&
						fetcher.data?.results?.hits?.map((h) => (
							<CommandItem
								key={h.url}
								value={h.url}
								className="group"
								onSelect={() => {
									runCommand(() => navigate(h.url as string));
								}}
							>
								<div className="flex justify-between w-full">
									<div className="flex space-x-2">
										{h.enabled === false ? (
											<ToggleLeft className="text-muted-foreground" size={14} />
										) : h.hasError ? (
											<AlertTriangle className="text-red-500" size={14} />
										) : (
											<Activity className="text-emerald-600" size={14} />
										)}

										<strong>{h.name || h.title}</strong>
										<span>{h.httpUrl || h.name ? h.title : ''}</span>
									</div>
									<div className="flex">
										{h.tags?.map((t) => (
											<Badge
												className="bg-slate-200 group-hover:bg-slate-300 group-hover:cursor-default text-slate-900"
												key={t}
											>
												{t}
											</Badge>
										))}
									</div>
								</div>
							</CommandItem>
						))}
				</CommandList>
			</CommandDialogDynamic>
		</>
	);
}
