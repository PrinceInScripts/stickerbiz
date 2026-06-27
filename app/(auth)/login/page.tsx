/**
 * Login Page — authentication entry point with seed-on-first-use.
 */

import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your StickerBiz inventory management dashboard.',
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-[400px] animate-fade-in">
      {/* Logo & Title */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7"
          >
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">StickerBiz</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your inventory dashboard
        </p>
      </div>

      <LoginForm />

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Default credentials: admin@stickerbiz.com / admin123
      </p>
    </div>
  );
}
