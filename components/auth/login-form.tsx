'use client';

/**
 * Login Form — client component with useActionState for server action integration.
 * Includes auto-seed for first-time setup.
 */

import { useActionState, useEffect, startTransition } from 'react';
import { loginAction, seedAdminAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import type { ActionResponse } from '@/types';

const initialState: ActionResponse = { success: false };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  // Auto-seed admin on first mount (idempotent — only creates if no admin exists)
  useEffect(() => {
    startTransition(async () => {
      await seedAdminAction();
    });
  }, []);

  // Show error toast on failed login
  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card className="border-0 shadow-xl">
      <form action={formAction}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@stickerbiz.com"
              required
              autoComplete="email"
              autoFocus
              disabled={isPending}
            />
            {state.fieldErrors?.email && (
              <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={isPending}
            />
            {state.fieldErrors?.password && (
              <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {isPending ? 'Signing in...' : 'Sign In'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
