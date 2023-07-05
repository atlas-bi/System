import { cn } from '@/lib/utils';
import { Link, useLocation } from '@remix-run/react';
import bytes from 'bytes';

import { buttonVariants } from './ui/button';

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    id: string;
    serverId: string;
    name: string;
    location?: string;
    root?: string;
    usage?: {
      free: string;
      used: string;
    }[];
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const { pathname } = useLocation();

  return (
    <nav
      className={cn(
        'flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1',
        className,
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.id}
          to={`/servers/${item.serverId}/drives/${item.id}`}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            pathname.startsWith(`/servers/${item.serverId}/drives/${item.id}`)
              ? 'bg-muted hover:bg-muted'
              : 'hover:bg-transparent hover:underline',
            'justify-start',
          )}
        >
          {item.name}{' '}
          {item.root ? (
            <>
              ({item.root}
              {item.location})
            </>
          ) : null}{' '}
          {bytes(Number(item.usage?.[0]?.free) + Number(item.usage?.[0]?.used))}
        </Link>
      ))}
    </nav>
  );
}
