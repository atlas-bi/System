import { cn } from '@/lib/utils';
import { Link, useLocation, useMatches } from '@remix-run/react';
import { Fragment, forwardRef } from 'react';
import { buttonVariants } from '~/components/ui/button';

import { monitorTypes as typeDict } from '~/models/monitor';

// export function SidebarNav({ className,  ...props }) {

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
        (item: { value: string; type: string }, index: number) => (
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
                    'justify-start space-x-2',
                  )}
                >
                  {x.icon}
                  <span>{x.name}</span>
                </Link>
              ))}
          </Fragment>
        ),
      )}
    </nav>
  );
});
