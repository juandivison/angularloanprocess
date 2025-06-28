import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private currentUser = new BehaviorSubject<User | null>(null);

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || ''
    );
    this.loadUser();
  }

  async loadUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    this.currentUser.next(user);
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    this.currentUser.next(data.user);
    return data.user;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password
    });
    
    if (error) throw error;
    return data.user;
  }

  async signOut() {
    await this.supabase.auth.signOut();
    this.currentUser.next(null);
  }

  getCurrentUser() {
    return this.currentUser.asObservable();
  }
}