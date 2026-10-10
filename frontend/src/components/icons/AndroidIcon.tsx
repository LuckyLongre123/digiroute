import React from 'react';

/**
 * AndroidIcon
 *
 * Vector icon representing the native Android platform (Bugdroid head).
 */
export function AndroidIcon({
  className = 'h-4 w-4 shrink-0',
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M16.61 15.15c-.41 0-.75-.34-.75-.75 0-.41.34-.75.75-.75.41 0 .75.34.75.75 0 .41-.34.75-.75.75zm-9.22 0c-.41 0-.75-.34-.75-.75 0-.41.34-.75.75-.75.41 0 .75.34.75.75 0 .41-.34.75-.75.75zM17.2 9.42l1.62-2.8a.42.42 0 10-.73-.42l-1.65 2.86a9.55 9.55 0 00-8.88 0L5.91 6.2a.42.42 0 10-.73.42l1.62 2.8C3.76 11.19 1.75 14.53 1.5 18.5h21c-.25-3.97-2.26-7.31-5.3-9.08z" />
    </svg>
  );
}
