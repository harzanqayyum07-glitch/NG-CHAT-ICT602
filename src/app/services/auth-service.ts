import { Injectable, NgZone, effect, inject, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase = inject(SupabaseService).supabase;
  private router = inject(Router);
  private _ngZone = inject(NgZone);
  currentUser = signal<User | null>(null);
  isAuthReady = signal(false);

  constructor() {
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Auth Event: ${event}`, session?.user?.id);

      // Set the current user from the session provided by the event
      this.currentUser.set(session?.user ?? null);

      if (session) {
        localStorage.setItem('session', JSON.stringify(session.user));
        
        try {
          // Ensure the user profile exists in public.users before proceeding
          console.log('Ensuring user profile exists...');
          await this.supabase.rpc('ensure_user_profile');
          console.log('User profile check complete.');
        } catch (error) {
          console.error('Error ensuring user profile:', error);
        }

        // Only navigate on initial sign-in to avoid redirect loops
        if (event === 'SIGNED_IN') {
          this._ngZone.run(() => {
            this.router.navigate(['/chat']);
          });
        }
      } else {
        localStorage.removeItem('session');
      }
      
      // Mark auth as ready ONLY after we have processed everything
      console.log('Auth state is now ready.');
      this.isAuthReady.set(true);
    });
  }

  // This getter can be used for quick, non-critical UI checks,
  // but the guard should rely on the async isAuthReady signal.
  get isLoggedIn(): boolean {
    const user = localStorage.getItem('session');
    return user !== null && user !== 'undefined' && user !== 'null';
  }

  async signInWithGoogle() {
    await this.supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  }

  async signOut() {
    await this.supabase.auth.signOut();
  }
}
