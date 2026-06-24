import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Gasto } from '../models/gasto.model';

export interface Categoria {
  id: number;
  nombre: string;
  color?: string;
  icono?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GastosService {
  // Inyección moderna de Angular
  private supabaseService = inject(SupabaseService);

  // Obtenemos el cliente directamente
  private supabase = this.supabaseService.client;

  // LEER
  async getGastos(): Promise<Gasto[]> {
    // Traemos los gastos y las categorías para mapear el nombre de la categoría
    const { data: gastosData, error: gastosError } = await this.supabase
      .from('gastos')
      .select('*')
      .order('fecha', { ascending: false });

    if (gastosError) throw gastosError;

    const { data: { user } } = await this.supabase.auth.getUser();
    let categoriasQuery = this.supabase.from('categorias').select('*');
    if (user) {
      categoriasQuery = categoriasQuery.or(`user_id.is.null,user_id.eq.${user.id}`);
    }

    const { data: categoriasData, error: categoriasError } = await categoriasQuery;

    if (categoriasError) {
      console.warn('Error al obtener categorias para mapear nombres:', categoriasError);
    }

    const catMap: Record<number, string> = {};
    if (categoriasData && Array.isArray(categoriasData)) {
      categoriasData.forEach((c: any) => {
        if (c && c.id != null) catMap[c.id] = c.nombre;
      });
    }

    const gastos = (gastosData || []).map((g: any) => {
      const gasto: Gasto = {
        id: g.id,
        concepto: g.concepto,
        monto: g.monto,
        fecha: g.fecha,
        categoria: g.categoria_id, // Corregido: usar categoria_id
        categoriaNombre: catMap[g.categoria_id] || (g.categoria_id != null ? String(g.categoria_id) : '')
      };
      return gasto;
    });

    return gastos;
  }

  // CREAR
  async addGasto(gasto: Gasto): Promise<Gasto> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    const payload = { ...gasto };
    if (user) {
      // Se agrega el user_id para cumplir con las políticas RLS de Supabase
      (payload as any).user_id = user.id;
    }

    const { data, error } = await this.supabase
      .from('gastos')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ACTUALIZAR
  async updateGasto(id: number, gasto: Partial<Gasto>): Promise<Gasto> {
    const { data, error } = await this.supabase
      .from('gastos')
      .update(gasto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ELIMINAR
  async deleteGasto(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('gastos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // OBTENER CATEGORIAS DESDE LA BASE DE DATOS
  // Devuelve lista de categorías completas {id, nombre}
  async getCategorias(): Promise<Categoria[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      let query = this.supabase
        .from('categorias')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (user) {
        query = query.or(`user_id.is.null,user_id.eq.${user.id}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data && data.length > 0) {
        return data as Categoria[];
      }
    } catch (err) {
      console.warn('No se pudo cargar de la tabla "categorias":', err);
    }
    return [];
  }

  // Obtiene el nombre de la categoría por id (carga cache si es necesario)
  private categoriasCache: Categoria[] | null = null;
  async getCategoriaNombre(id: number | null | undefined): Promise<string> {
    if (id == null) return '';
    if (!this.categoriasCache) {
      this.categoriasCache = await this.getCategorias();
    }
    const found = this.categoriasCache.find(c => c.id === id);
    return found ? found.nombre : String(id);
  }
}