'use client';

import React, { useTransition } from 'react';
import Link, { type LinkProps } from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export interface TransitionLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | 'children'>,
    Omit<LinkProps, 'children'> {
  children?:
    | React.ReactNode
    | ((props: { isPending: boolean }) => React.ReactNode);
  /**
   * Whether to display a spinner when route transition is pending.
   * @default true
   */
  showSpinner?: boolean;
  /**
   * Placement of the spinner relative to children.
   * - 'start': Before children (default)
   * - 'end': After children
   * - 'replace': Replaces children with spinner
   * @default 'start'
   */
  spinnerPlacement?: 'start' | 'end' | 'replace';
  /**
   * Optional custom text to display when pending.
   */
  pendingText?: string;
  /**
   * Additional className to apply when pending.
   */
  pendingClassName?: string;
  /**
   * Size/className for the Loader2 spinner.
   * @default 'h-4 w-4 shrink-0 animate-spin'
   */
  spinnerClassName?: string;
}

/**
 * TransitionLink - High-performance wrapper around Next.js <Link> that provides
 * instantaneous visual feedback using React's useTransition to eliminate "dead clicks"
 * on slow networks.
 *
 * Adheres strictly to the Refined Utilitarian design system.
 */
export const TransitionLink = React.forwardRef<
  HTMLAnchorElement,
  TransitionLinkProps
>(function TransitionLink(
  {
    href,
    children,
    className = '',
    onClick,
    replace = false,
    scroll = true,
    showSpinner = true,
    spinnerPlacement = 'start',
    pendingText,
    pendingClassName = 'opacity-80 cursor-wait pointer-events-none',
    spinnerClassName = 'h-4 w-4 shrink-0 animate-spin',
    ...rest
  },
  ref
) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // 1. Call any custom onClick handler first
    if (onClick) {
      onClick(e);
      if (e.defaultPrevented) return;
    }

    // 2. Allow normal browser behavior for modified clicks (new tab, new window)
    if (
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      rest.target === '_blank'
    ) {
      return;
    }

    // 3. Prevent double clicks while pending
    if (isPending) {
      e.preventDefault();
      return;
    }

    const targetUrl = typeof href === 'object' ? href.pathname || '' : href;

    // 4. If already on the exact target path, let Next.js handle or ignore
    if (targetUrl === pathname) {
      return;
    }

    // 5. Trigger transition with immediate feedback
    e.preventDefault();
    startTransition(() => {
      let destination: string;
      if (typeof href === 'string') {
        destination = href;
      } else {
        const queryStr = href.query
          ? typeof href.query === 'string'
            ? `?${href.query}`
            : `?${new URLSearchParams(href.query as Record<string, string>).toString()}`
          : '';
        const hashStr = href.hash ? `#${href.hash}` : '';
        destination = `${href.pathname || '/'}${queryStr}${hashStr}`;
      }

      if (replace) {
        router.replace(destination, { scroll });
      } else {
        router.push(destination, { scroll });
      }
    });
  };

  const renderContent = () => {
    if (typeof children === 'function') {
      return children({ isPending });
    }

    if (!isPending || !showSpinner) {
      return children;
    }

    const spinner = <Loader2 className={spinnerClassName} aria-hidden="true" />;

    if (spinnerPlacement === 'replace') {
      return (
        <>
          {spinner}
          {pendingText && <span>{pendingText}</span>}
        </>
      );
    }

    if (spinnerPlacement === 'end') {
      return (
        <>
          {pendingText ? <span>{pendingText}</span> : children}
          {spinner}
        </>
      );
    }

    // Default 'start'
    return (
      <>
        {spinner}
        {pendingText ? <span>{pendingText}</span> : children}
      </>
    );
  };

  return (
    <Link
      ref={ref}
      href={href}
      onClick={handleClick}
      replace={replace}
      scroll={scroll}
      aria-busy={isPending}
      aria-disabled={isPending}
      className={`${className} ${isPending ? pendingClassName : ''}`.trim()}
      {...rest}
    >
      {renderContent()}
    </Link>
  );
});

TransitionLink.displayName = 'TransitionLink';
