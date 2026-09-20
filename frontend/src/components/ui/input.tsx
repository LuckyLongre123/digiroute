import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 h-9 w-full min-w-0 rounded-lg border border-zinc-300 bg-transparent px-3 py-1.5 text-sm focus:ring-[3px] focus:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export { Input };
