'use client';

/**
 * Theme Provider — wraps next-themes for dark/light mode support.
 * Must be a client component.
 */

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
