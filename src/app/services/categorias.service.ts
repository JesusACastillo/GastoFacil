import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';

export interface Categoria {
  id?: number;
  nombre: string;
  color?: string;
  icono?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.client;

  constructor() { }

  async addCategoria(categoria: Categoria): Promise<any> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    const payload: any = { 
      nombre: categoria.nombre, 
      color: categoria.color, 
      icono: categoria.icono 
    };

    if (user) {
      payload.user_id = user.id;
    }

    console.log('--- ENVIANDO A SUPABASE ---', payload);

    const { data, error } = await this.supabase
      .from('categorias')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error adding category:', error);
      throw error;
    }
    return data;
  }
}
