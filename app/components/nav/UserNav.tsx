import type { User as userType } from '@prisma/client';
import { useLoaderData } from '@remix-run/react';
import { Link } from '@remix-run/react';
import { useFetcher } from '@remix-run/react';
import { Inbox, LogOut, Settings, Settings2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

import type { loader } from '../routes/_auth/route';

export function UserNav() {
  const { user } = useLoaderData<typeof loader>();
  const [activeUser, setActiveUser] = useState(user);
  const fetcher = useFetcher();

  useEffect(() => {
    setActiveUser(user);
  }, [user]);

  const initials = (user: userType) => {
    return (user?.firstName?.slice(0, 1) || 'U') + user?.lastName?.slice(0, 1);
  };

  useEffect(() => {
    if (fetcher.state === 'idle' && !fetcher.data) {
      fetcher.load(`/api/user/${user.slug}?index`);
    } else if (fetcher.data) {
      setActiveUser({ ...activeUser, ...fetcher.data.user });
    }
  }, [fetcher]);

  return (
    <>
      {activeUser && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="m-auto relative h-8 w-8 rounded-full ring-2 ring-offset-2 ring-blueBase focus-visible:ring-blueBase"
            >
              <Avatar className="h-8 w-8">
                {activeUser?.profilePhoto && (
                  <AvatarImage
                    src={`data:image/*;base64,${activeUser.profilePhoto}`}
                    alt={initials(activeUser)}
                  />
                )}

                <AvatarFallback>{initials(activeUser)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mt-1" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activeUser.firstName} {activeUser.lastName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {activeUser.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/logout" prefetch="intent" className="flex grow">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}
