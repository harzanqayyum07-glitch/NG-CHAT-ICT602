import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth-service';
import { filter, map, take } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Convert the isAuthReady signal to an observable to use with RxJS operators
  return toObservable(authService.isAuthReady).pipe(
    // Wait until the auth state is actually resolved
    filter(isReady => isReady === true),
    // We only need to check this once per navigation
    take(1),
    // Once auth is ready, check if a user exists
    map(() => {
      if (authService.currentUser()) {
        // If user exists, allow navigation
        return true;
      } else {
        // If no user, redirect to login and block navigation
        router.navigate(['/login']);
        return false;
      }
    })
  );
};
