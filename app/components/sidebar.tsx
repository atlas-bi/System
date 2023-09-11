import { cn } from '@/lib/utils';
import { Link, useLocation, useMatches } from '@remix-run/react';
import { Fragment, forwardRef } from 'react';
import { buttonVariants } from '~/components/ui/button';

import { monitorTypes as typeDict } from '~/models/monitor';
import { Badge } from './ui/badge';

export const SidebarNav = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	const { pathname } = useLocation();
	const matches = useMatches();

	const { monitorTypes } = matches.filter((x) => x.id === 'routes/_auth')[0]
		.data;

	return (
		<nav
			className={cn(
				'flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1',
				className,
			)}
			{...props}
		>
			{monitorTypes.map(
				(
					item: { value: string; type: string; _count: { type: string } },
					index: number,
				) => (
					<Fragment key={index}>
						{typeDict
							.filter((x) => x.value === item.type)
							?.map((x) => (
								<Link
									key={x.value}
									to={`/${x.value}`}
									className={cn(
										buttonVariants({ variant: 'ghost' }),
										pathname.startsWith('/' + x.value)
											? 'bg-muted hover:bg-muted'
											: 'hover:bg-transparent hover:underline',
										'justify-between space-x-2',
									)}
								>
									<div className="justify-start flex space-x-2">
										<div className="flex w-4 h-4 text-muted-foreground">
											{x.icon}
										</div>
										<span>{x.name}</span>
									</div>
									<Badge className="bg-slate-200 text-slate-900">
										{item._count.type}
									</Badge>
								</Link>
							))}
					</Fragment>
				),
			)}
		</nav>
	);
});
