import * as React from 'react';

import { cn } from '@/lib/utils';

const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<'select'>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400',
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

export { Select };
