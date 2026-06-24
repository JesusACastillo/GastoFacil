import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.client;

  // Guardamos el estado del usuario de forma reactiva
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$: Observable<any> = this.currentUserSubject.asObservable();

  constructor() {
    this.loadSession();

    // Escuchar cambios de estado en la autenticación
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentUserSubject.next(session?.user || null);
    });
  }

  async loadSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.currentUserSubject.next(session?.user || null);

    // Si no hay sesión, iniciar anónimamente por defecto
    if (!session) {
      this.signInAnonymously().catch(err => console.error('Error auto-anonymous login', err));
    }
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string, nombre: string) {
    if (this.isAnonymous()) {
      // Convertir cuenta anónima a permanente
      const { data, error } = await this.supabase.auth.updateUser({
        email,
        password,
        data: { nombre: nombre }
      });
      if (error) throw error;
      return data;
    } else {
      // Registro normal si por alguna razón no estaba anónimo
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nombre: nombre }
        }
      });
      if (error) throw error;
      return data;
    }
  }

  async signInAnonymously() {
    const { data, error } = await this.supabase.auth.signInAnonymously();
    if (error) throw error;
    return data;
  }

  isAnonymous(): boolean {
    const user = this.currentUserSubject.value;
    return user?.is_anonymous === true;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  getCurrentUser() {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  incrementAndCheckGuestRegistrations(): boolean {
    // Si el usuario ya está logueado con una cuenta real (no anónima), no mostramos nada
    if (this.isLoggedIn() && !this.isAnonymous()) return false;

    let count = parseInt(localStorage.getItem('guest_registrations') || '0', 10);
    count++;
    localStorage.setItem('guest_registrations', count.toString());

    // Mostramos la alerta exactamente en el registro 5, o múltiplos si se desea insistir.
    // Lo pondremos solo cuando count == 5, y tal vez cada 5 más.
    return count % 5 === 0;
  }
}
