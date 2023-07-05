import { cn } from '@/lib/utils';
import { Form, Link, useLocation } from '@remix-run/react';
import { Button, buttonVariants } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
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
      {items.map((item, index) => (
        <Link
          key={item.id}
          to={`/servers/${item.id}/drives`}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            pathname.startsWith(`/servers/${item.id}`)
              ? 'bg-muted hover:bg-muted'
              : 'hover:bg-transparent hover:underline',
            'justify-start',
          )}
        >
          {item.title} {item.name ? <>({item.name})</> : null}
        </Link>
      ))}

      <Dialog>
        <DialogTrigger asChild>
          <Link
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'hover:bg-transparent hover:underline',
              'justify-start',
            )}
          >
            Add Server
          </Link>
        </DialogTrigger>
        <DialogContent className="sm:min-w-[425px] sm:max-w-fit">
          <DialogHeader>
            <DialogTitle>Add Server</DialogTitle>
            <DialogDescription>
              Add a new server for monitoring
            </DialogDescription>
          </DialogHeader>
          <Form method="post">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Name
                </Label>
                <Input
                  name="title"
                  id="title"
                  placeholder="Server 1"
                  className="col-span-3"
                />
                <input type="hidden" name="_action" value="new" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
