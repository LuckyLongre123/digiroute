import React from 'react';

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * Server-Rendered XSS-Safe JSON-LD Component
 *
 * Emits a native <script type="application/ld+json"> tag with raw '<' characters
 * escaped to unicode '\u003c' to prevent script injection vulnerabilities.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
