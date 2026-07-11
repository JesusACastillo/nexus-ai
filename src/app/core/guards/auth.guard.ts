import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

/**
 * Protects private routes.
 * If the user has NO session → redirect to /login.
 */
export const authGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const session = await supabase.getSession();

  if (session) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

/**
 * Protects public-only routes.
 * If the user already HAS a session → redirect to /dashboard.
 */
export const publicGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const session = await supabase.getSession();

  if (!session) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};