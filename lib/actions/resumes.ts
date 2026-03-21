'use server';

import { createClient } from '@/lib/supabase/server';
import { mapTalentPoolEntriesToGeneralCvs } from '@/lib/actions/resume_mappers';

export type CvType = 'general' | 'job_specific';

export interface GeneralCvData {
  id: number;
  user_id: string;
  cv_type: CvType;
  bucket: string;
  path: string;
  mime_type: string;
  file_size_bytes: number;
  created_at: string;
  candidate?: {
    id: string;
    name: string;
    supabase_id: string;
  };
  talent_pool?: {
    id: number;
    position_id: number | null;
    location_id: number | null;
    position?: { id: number; description: string } | null;
    location?: { id: number; name: string } | null;
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error inesperado';
}

const handleSupabaseError = (error: unknown, context: string) => {
  console.error(`Error in ${context}:`, error);
  return { data: null, error: getErrorMessage(error) };
};

const validateSupabaseClient = async () => {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error('Error de configuración del servidor');
  }
  return supabase;
};

export async function getGeneralCvs(): Promise<{ data: GeneralCvData[] | null; error?: string }> {
  try {
    const supabase = await validateSupabaseClient();

    const { data: entries, error } = await supabase
      .from('talent_pool_cv')
      .select(`
        id,
        position:position_id (id, description),
        location:location_id (id, name),
        cv:candidate_cvs (*, candidate:user_id (id, name, supabase_id))
      `)
      .eq('cv.cv_type', 'general')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const data = mapTalentPoolEntriesToGeneralCvs(entries) as GeneralCvData[];

    return { data };
  } catch (error) {
    return handleSupabaseError(error, 'getGeneralCvs');
  }
}

export async function getCvById(cvId: number): Promise<{ data: GeneralCvData | null; error?: string }> {
  try {
    const supabase = await validateSupabaseClient();

    const { data: cv, error } = await supabase
      .from('candidate_cvs')
      .select('*, candidate:user_id (id, name, supabase_id)')
      .eq('id', cvId)
      .single();

    if (error) {
      throw error;
    }

    const { data: talentPool } = await supabase
      .from('talent_pool_cv')
      .select('*, position:position_id (id, description), location:location_id (id, name)')
      .eq('cv_id', cvId)
      .single();

    return { data: { ...cv, talent_pool: talentPool ?? null } as GeneralCvData };
  } catch (error) {
    return handleSupabaseError(error, 'getCvById');
  }
}
