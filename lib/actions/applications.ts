'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ApplicationStatus } from '@/lib/constants';
import type { ApplicationNoteData } from '@/lib/application_note_types';
import { buildNoteTree } from '@/lib/application_notes';
import { buildApplicationSearchFilter, buildSearchVariants } from '@/lib/application_search';

export interface ActionResult {
  error?: string;
  success?: boolean;
}

export interface ApplicationStatusUpdateData {
  status: ApplicationStatus;
  status_changed_at: string;
  updated_at: string | null;
}

export interface CandidateProfile {
  id: string;
  name: string;
  supabase_id: string;
  email?: string;
}

export interface AnswerData {
  id: number;
  value: string;
  question_id: number;
  user_id: string;
  created_at: string;
  question?: {
    id: number;
    description: string;
    job_id?: number;
  };
}

export interface ApplicationEducationData {
  id: number;
  application_id: number;
  institution_name: string;
  degree_level: string;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  is_in_progress: boolean;
  created_at: string;
}

export interface ApplicationWorkExperienceData {
  id: number;
  application_id: number;
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  responsibilities: string | null;
  created_at: string;
}

export interface ApplicationData {
  id: number;
  user_id: string;
  job_id: number;
  cv_id: number;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string | null;
  status_changed_at: string;
  applicant_full_name: string;
  applicant_id_number: string;
  applicant_phone: string;
  residence_province_code: number;
  residence_canton_code: number;
  residence_detail: string | null;
  // Joined data
  candidate?: CandidateProfile;
  job?: {
    id: number;
    title: string;
    description: string;
    company_data?: { name: string };
    location_data?: { name: string };
  };
  cv?: {
    id: number;
    bucket: string;
    path: string;
    mime_type: string;
  };
  answers?: AnswerData[];
  notes?: ApplicationNoteData[];
  education?: ApplicationEducationData[];
  work_experience?: ApplicationWorkExperienceData[];
}

// ─── Private helpers ─────────────────────────────────────────────────────────

type SupabaseClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;

type JobSearchRow = { id: number };
type CompanySearchRow = { id: number };
type LocationSearchRow = { id: number };

async function findMatchingApplicationJobIds(
  supabase: SupabaseClient,
  {
    search,
    companyId,
    locationId,
  }: {
    search?: string;
    companyId?: number;
    locationId?: number;
  }
) {
  const trimmedSearch = (search || '').trim();

  if (!trimmedSearch && !companyId && !locationId) {
    return { jobIds: [] as number[] };
  }

  let jobsQuery = supabase.from('job').select('id');

  if (companyId) {
    jobsQuery = jobsQuery.eq('company', companyId);
  }

  if (locationId) {
    jobsQuery = jobsQuery.eq('location', locationId);
  }

  if (trimmedSearch) {
    const searchVariants = buildSearchVariants(trimmedSearch);
    const textFilters = searchVariants.map((variant) => `title.ilike.%${variant}%`);
    const companyFilters = searchVariants.map((variant) => `name.ilike.%${variant}%`);
    const locationFilters = searchVariants.map((variant) => `name.ilike.%${variant}%`);

    const [
      { data: matchingCompanies, error: companyError },
      { data: matchingLocations, error: locationError },
    ] = await Promise.all([
      supabase.from('company').select('id').or(companyFilters.join(',')),
      supabase.from('location').select('id').or(locationFilters.join(',')),
    ]);

    if (companyError) {
      return { jobIds: [] as number[], error: companyError };
    }

    if (locationError) {
      return { jobIds: [] as number[], error: locationError };
    }

    const companyIds = ((matchingCompanies || []) as CompanySearchRow[]).map((company) => company.id);
    const locationIds = ((matchingLocations || []) as LocationSearchRow[]).map((location) => location.id);

    if (companyIds.length > 0) {
      textFilters.push(`company.in.(${companyIds.join(',')})`);
    }

    if (locationIds.length > 0) {
      textFilters.push(`location.in.(${locationIds.join(',')})`);
    }

    jobsQuery = jobsQuery.or(textFilters.join(','));
  }

  const { data: matchingJobs, error: jobError } = await jobsQuery;

  if (jobError) {
    return { jobIds: [] as number[], error: jobError };
  }

  return {
    jobIds: Array.from(new Set(((matchingJobs || []) as JobSearchRow[]).map((job) => job.id))),
  };
}

async function fetchApplicationExtraDetails(
  supabase: SupabaseClient,
  app: { id: number; user_id: string; job_id: number }
) {
  const [{ data: answers }, { data: education }, { data: workExp }, { data: notes }] =
    await Promise.all([
      supabase
        .from('answer')
        .select('*, question:question_id (id, description, job_id)')
        .eq('user_id', app.user_id)
        .eq('question.job_id', app.job_id),
      supabase
        .from('job_application_education')
        .select('*')
        .eq('application_id', app.id)
        .order('start_date', { ascending: false }),
      supabase
        .from('job_application_work_experience')
        .select('*')
        .eq('application_id', app.id)
        .order('start_date', { ascending: false }),
      supabase
        .from('application_note')
        .select('*, author:author_id (id, name)')
        .eq('application_id', app.id)
        .order('created_at', { ascending: true }),
    ]);

  return {
    answers: (answers || []) as AnswerData[],
    education: (education || []) as ApplicationEducationData[],
    work_experience: (workExp || []) as ApplicationWorkExperienceData[],
    notes: buildNoteTree((notes || []) as ApplicationNoteData[]),
  };
}

/**
 * Obtiene todas las aplicaciones
 */
export async function getApplications({
  limit = 10,
  offset = 0,
  status,
  search,
  companyId,
  locationId,
  includeDetails = false,
}: {
  limit?: number;
  offset?: number;
  status?: ApplicationStatus | "all";
  search?: string;
  companyId?: number | null;
  locationId?: number | null;
  includeDetails?: boolean;
} = {}): Promise<{ data: ApplicationData[] | null; total: number; error?: string }> {
  const supabase = await createClient();

  if (!supabase) {
    return { data: null, total: 0, error: 'Error de configuración del servidor' };
  }

  let query = supabase
    .from('job_application')
    .select(
      `
      *,
      candidate:user_id (id, name, supabase_id),
      job:job_id (
        id, title, description,
        company_data:company (name),
        location_data:location (name)
      ),
      cv:cv_id (id, bucket, path, mime_type)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const trimmedSearch = (search || '').trim();
  const selectedCompanyId = typeof companyId === 'number' && Number.isFinite(companyId) ? companyId : undefined;
  const selectedLocationId = typeof locationId === 'number' && Number.isFinite(locationId) ? locationId : undefined;

  if (selectedCompanyId || selectedLocationId) {
    const { jobIds, error } = await findMatchingApplicationJobIds(supabase, {
      companyId: selectedCompanyId,
      locationId: selectedLocationId,
    });

    if (error) {
      console.error('Error fetching scoped application jobs:', error);
      return { data: null, total: 0, error: error.message };
    }

    if (jobIds.length === 0) {
      return { data: [], total: 0 };
    }

    query = query.in('job_id', jobIds);
  }

  if (trimmedSearch) {
    const { jobIds, error } = await findMatchingApplicationJobIds(supabase, {
      search: trimmedSearch,
      companyId: selectedCompanyId,
      locationId: selectedLocationId,
    });

    if (error) {
      console.error('Error fetching matching application jobs:', error);
      return { data: null, total: 0, error: error.message };
    }

    query = query.or(buildApplicationSearchFilter(trimmedSearch, jobIds));
  }

  const { data: applications, error, count } = await query;

  if (error) {
    console.error('Error fetching applications:', error);
    return { data: null, total: 0, error: error.message };
  }

  // Si no se requieren detalles, retornamos directamente
  if (!includeDetails) {
    return { data: (applications || []) as ApplicationData[], total: count || 0 };
  }

  const appsWithDetails = await Promise.all(
    (applications || []).map((app) =>
      fetchApplicationExtraDetails(supabase, app).then((extra) => ({ ...app, ...extra }))
    )
  );

  return { data: appsWithDetails as ApplicationData[], total: count || appsWithDetails.length };
}

/**
 * Obtiene una aplicación por ID
 */
export async function getApplicationById(appId: number): Promise<{ data: ApplicationData | null; error?: string }> {
  const supabase = await createClient();

  if (!supabase) {
    return { data: null, error: 'Error de configuración del servidor' };
  }

  const { data: app, error } = await supabase
    .from('job_application')
    .select(`
      *,
      candidate:user_id (id, name, supabase_id),
      job:job_id (
        id, title, description,
        company_data:company (name),
        location_data:location (name)
      ),
      cv:cv_id (id, bucket, path, mime_type)
    `)
    .eq('id', appId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  const extra = await fetchApplicationExtraDetails(supabase, app);

  return { data: { ...app, ...extra } as ApplicationData };
}

/**
 * Actualiza el estado de una aplicación
 */
export async function updateApplicationStatus(
  appId: number,
  status: ApplicationStatus
): Promise<ActionResult & { data?: ApplicationStatusUpdateData }> {
  const supabase = await createClient();

  if (!supabase) {
    return { error: 'Error de configuración del servidor' };
  }

  const changedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('job_application')
    .update({
      status,
      updated_at: changedAt,
      status_changed_at: changedAt,
    })
    .eq('id', appId)
    .select('status, status_changed_at, updated_at')
    .single();

  if (error) {
    console.error('Error updating application status:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/aplicaciones');
  return {
    success: true,
    data: (data as ApplicationStatusUpdateData | null) ?? {
      status,
      status_changed_at: changedAt,
      updated_at: changedAt,
    },
  };
}

/**
 * Agrega una nota/comentario a una aplicación
 */
export async function addApplicationNote(
  applicationId: number,
  body: string,
  replyToId?: number
): Promise<{ data?: ApplicationNoteData; error?: string }> {
  const supabase = await createClient();

  if (!supabase) {
    return { error: 'Error de configuración del servidor' };
  }

  // Obtener el perfil del usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Usuario no autenticado' };
  }

  const { data: profile } = await supabase
    .from('user_profile')
    .select('id')
    .eq('supabase_id', user.id)
    .single();

  if (!profile) {
    return { error: 'Perfil de usuario no encontrado' };
  }

  const { data: note, error } = await supabase
    .from('application_note')
    .insert({
      application_id: applicationId,
      author_id: profile.id,
      body,
      reply_to_id: replyToId || null,
    })
    .select(`
      *,
      author:author_id (id, name)
    `)
    .single();

  if (error) {
    console.error('Error adding note:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/aplicaciones');
  return { data: note as ApplicationNoteData };
}

/**
 * Elimina una nota de aplicación
 */
export async function deleteApplicationNote(noteId: number): Promise<ActionResult> {
  const supabase = await createClient();

  if (!supabase) {
    return { error: 'Error de configuración del servidor' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Usuario no autenticado' };
  }

  const { data: profile } = await supabase
    .from('user_profile')
    .select('id, user_role')
    .eq('supabase_id', user.id)
    .single();

  if (!profile) {
    return { error: 'Perfil de usuario no encontrado' };
  }

  const { data: note } = await supabase
    .from('application_note')
    .select('author_id')
    .eq('id', noteId)
    .single();

  if (!note) {
    return { error: 'Nota no encontrada' };
  }

  if (note.author_id !== profile.id && profile.user_role !== 'admin') {
    return { error: 'No tienes permiso para eliminar esta nota' };
  }

  const { error } = await supabase
    .from('application_note')
    .delete()
    .eq('id', noteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/aplicaciones');
  return { success: true };
}

/**
 * Obtiene las notas de una aplicación
 */
export async function getApplicationNotes(applicationId: number): Promise<{ data: ApplicationNoteData[] | null; error?: string }> {
  const supabase = await createClient();

  if (!supabase) {
    return { data: null, error: 'Error de configuración del servidor' };
  }

  const { data: notes, error } = await supabase
    .from('application_note')
    .select(`
      *,
      author:author_id (id, name)
    `)
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: buildNoteTree((notes || []) as ApplicationNoteData[]) };
}
