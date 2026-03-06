'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface ActionResult {
  error?: string;
  success?: boolean;
}

// =====================================================================
// COMPANIES
// =====================================================================

export interface CompanyData {
  id: number;
  name: string;
  created_at: string;
}

/**
 * Obtiene todas las compañías
 */
export async function getCompanies(): Promise<{ data: CompanyData[] | null; error?: string }> {
  const supabase = await createClient();

  if (!supabase) {
    return { data: null, error: 'Error de configuración del servidor' };
  }

  const { data, error } = await supabase
    .from('company')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching companies:', error);
    return { data: null, error: error.message };
  }

  return { data };
}

/**
 * Crea una nueva compañía
 */
export async function createCompany(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  if (!supabase) {
    return { error: 'Error de configuración del servidor' };
  }

  const name = formData.get('name') as string;

  if (!name || name.trim() === '') {
    return { error: 'El nombre es requerido' };
  }

  const { error } = await supabase
    .from('company')
    .insert({ name: name.trim() });

  if (error) {
    console.error('Error creating company:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/configuracion');
  return { success: true };
}

/**
 * Actualiza una compañía existente
 */
export async function updateCompany(id: number, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  if (!supabase) {
    return { error: 'Error de configuración del servidor' };
  }

  const name = formData.get('name') as string;

  if (!name || name.trim() === '') {
    return { error: 'El nombre es requerido' };
  }

  const { error } = await supabase
    .from('company')
    .update({ name: name.trim() })
    .eq('id', id);

  if (error) {
    console.error('Error updating company:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/configuracion');
  return { success: true };
}

/**
 * Elimina una compañía
 */
export async function deleteCompany(id: number): Promise<ActionResult> {
  const supabase = await createClient();

  if (!supabase) {
    return { error: 'Error de configuración del servidor' };
  }

  const { error } = await supabase
    .from('company')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting company:', error);
    if (error.message.includes('violates foreign key constraint')) {
      return { error: 'No se puede eliminar: hay ofertas de empleo asociadas a esta compañía' };
    }
    return { error: error.message };
  }

  revalidatePath('/dashboard/configuracion');
  return { success: true };
}

// =====================================================================
// LOCATIONS
// =====================================================================

export interface LocationData {
  id: number;
  name: string;
  created_at: string;
}

/**
 * Obtiene todas las ubicaciones
 */
export async function getLocations(): Promise<{ data: LocationData[] | null; error?: string }> {
  const supabase = await createClient();

  if (!supabase) {
    return { data: null, error: 'Error de configuración del servidor' };
  }

  const { data, error } = await supabase
    .from('location')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching locations:', error);
    return { data: null, error: error.message };
  }

  return { data };
}

/**
 * Crea una nueva ubicación
 */
export async function createLocation(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  if (!supabase) {
    return { error: 'Error de configuración del servidor' };
  }

  const name = formData.get('name') as string;

  if (!name || name.trim() === '') {
    return { error: 'El nombre es requerido' };
  }

  const { error } = await supabase
    .from('location')
    .insert({ name: name.trim() });

  if (error) {
    console.error('Error creating location:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/configuracion');
  return { success: true };
}

/**
 * Actualiza una ubicación existente
 */
export async function updateLocation(id: number, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  if (!supabase) {
    return { error: 'Error de configuración del servidor' };
  }

  const name = formData.get('name') as string;

  if (!name || name.trim() === '') {
    return { error: 'El nombre es requerido' };
  }

  const { error } = await supabase
    .from('location')
    .update({ name: name.trim() })
    .eq('id', id);

  if (error) {
    console.error('Error updating location:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/configuracion');
  return { success: true };
}

/**
 * Elimina una ubicación
 */
export async function deleteLocation(id: number): Promise<ActionResult> {
  const supabase = await createClient();

  if (!supabase) {
    return { error: 'Error de configuración del servidor' };
  }

  const { error } = await supabase
    .from('location')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting location:', error);
    if (error.message.includes('violates foreign key constraint')) {
      return { error: 'No se puede eliminar: hay ofertas de empleo asociadas a esta ubicación' };
    }
    return { error: error.message };
  }

  revalidatePath('/dashboard/configuracion');
  return { success: true };
}

// =====================================================================
// POSITIONS
// =====================================================================

export interface PositionData {
  id: number;
  description: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

/**
 * Obtiene todas las posiciones
 */
export async function getPositions(): Promise<{ data: PositionData[] | null; error?: string }> {
  const supabase = await createClient();

  if (!supabase) {
    return { data: null, error: 'Error de configuración del servidor' };
  }

  const { data, error } = await supabase
    .from('position')
    .select('*')
    .order('description', { ascending: true });

  if (error) {
    console.error('Error fetching positions:', error);
    return { data: null, error: error.message };
  }

  return { data };
}

/**
 * Crea una nueva posición
 */
export async function createPosition(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  if (!supabase) {
    return { error: 'Error de configuración del servidor' };
  }

  const description = formData.get('description') as string;

  if (!description || description.trim() === '') {
    return { error: 'La descripción es requerida' };
  }

  // Obtener el perfil del usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Usuario no autenticado' };
  }

  const { data: currentProfile } = await supabase
    .from('user_profile')
    .select('id')
    .eq('supabase_id', user.id)
    .single();

  if (!currentProfile) {
    return { error: 'Perfil de usuario no encontrado' };
  }

  const { error } = await supabase
    .from('position')
    .insert({ 
      description: description.trim(),
      created_by: currentProfile.id,
      is_active: true
    });

  if (error) {
    console.error('Error creating position:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/configuracion');
  return { success: true };
}

/**
 * Actualiza una posición existente
 */
export async function updatePosition(id: number, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  if (!supabase) {
    return { error: 'Error de configuración del servidor' };
  }

  const description = formData.get('description') as string;

  if (!description || description.trim() === '') {
    return { error: 'La descripción es requerida' };
  }

  const { error } = await supabase
    .from('position')
    .update({ description: description.trim() })
    .eq('id', id);

  if (error) {
    console.error('Error updating position:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/configuracion');
  return { success: true };
}

/**
 * Activa o desactiva una posición
 */
export async function togglePositionStatus(id: number, isActive: boolean): Promise<ActionResult> {
  const supabase = await createClient();

  if (!supabase) {
    return { error: 'Error de configuración del servidor' };
  }

  const { error } = await supabase
    .from('position')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) {
    console.error('Error toggling position status:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/configuracion');
  return { success: true };
}

/**
 * Elimina una posición
 */
export async function deletePosition(id: number): Promise<ActionResult> {
  const supabase = await createClient();

  if (!supabase) {
    return { error: 'Error de configuración del servidor' };
  }

  const { error } = await supabase
    .from('position')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting position:', error);
    if (error.message.includes('violates foreign key constraint')) {
      return { error: 'No se puede eliminar: hay ofertas de empleo asociadas a esta posición' };
    }
    return { error: error.message };
  }

  revalidatePath('/dashboard/configuracion');
  return { success: true };
}
