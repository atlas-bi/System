import { cn } from '@/lib/utils';
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

import type { loader } from './route';

type actionData = { error: string } | undefined;

function ErrorMessage({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { error: loaderError } = useLoaderData<typeof loader>();
  const actionData = useActionData<actionData>();
  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state == 'submitting') {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [navigation]);

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Form method="post" className="space-y-2">
        {loaderError ? <ErrorMessage message={loaderError.message} /> : null}
        {actionData?.error ? <ErrorMessage message={actionData.error} /> : null}
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label className="" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-1">
            <Label className="" htmlFor="password">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="password"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isLoading}
            />
          </div>
          <Button disabled={isLoading}>
            {isLoading ? (
              <Loader2
                className="mr-2 h-4 w-4 
animate-spin"
              />
            ) : null}
            Sign In
          </Button>
        </div>
      </Form>
    </div>
  );
}
