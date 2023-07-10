import { cn } from '@/lib/utils';
import * as React from 'react';

export interface HProps extends React.HTMLAttributes<HTMLElement> {}

const H1 = React.forwardRef<HTMLElement, HProps>(
  ({ className, ...props }, ref) => {
    return (
      <h1
        className={cn(
          'first:mt-2 mb-4  scroll-m-20 text-3xl font-medium tracking-normal lg:text-4xl',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

H1.displayName = 'H1';

const H2 = React.forwardRef<HTMLElement, HProps>(
  ({ className, ...props }, ref) => {
    return (
      <h2
        className={cn(
          'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

H2.displayName = 'H2';

const H3 = React.forwardRef<HTMLElement, HProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        className={cn(
          'scroll-m-20 text-xl font-semibold tracking-tight',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

H3.displayName = 'H3';
export { H1, H2, H3 };
