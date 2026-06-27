'use client';

/**
 * Sonner Toast Provider — renders toast notifications globally.
 */

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from 'next-themes';

export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme as 'light' | 'dark' | 'system'}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast bg-background text-foreground border-border shadow-lg rounded-xl',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
        },
      }}
      richColors
      closeButton
    />
  );
}
