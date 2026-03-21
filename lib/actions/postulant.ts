'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { QuestionFormat } from '@/types/jobs';

const ALLOWED_CV_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_CV_BYTES = 5 * 1024 * 1024; // 5 MB
const CV_BUCKET = 'cvs_bucket';

function validateCVFile(file: File): string | null {
  if (!file || file.size === 0) return 'Debes seleccionar un archivo';
  if (!ALLOWED_CV_TYPES.includes(file.type)) return 'Solo se permiten archivos PDF, DOC o DOCX';
  if (file.size > MAX_CV_BYTES) return 'El archivo no puede superar los 5MB';
  return null;
}

export interface ActionResult {
  error?: string;
  success?: boolean;
}

interface EducationPayload {
  degreeLevel?: string;
  endDate?: string;
  fieldOfStudy?: string;
  institutionName?: string;
  isInProgress?: boolean;
  startDate?: string;
}

interface WorkExperiencePayload {
  companyName?: string;
  endDate?: string;
  isCurrent?: boolean;
  jobTitle?: string;
  responsibilities?: string;
  startDate?: string;
}

interface StorageErrorShape {
  status?: number;
  statusCode?: string;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toEducationPayload(value: unknown): EducationPayload | null {
  if (!isObjectRecord(value)) {
    return null;
  }

  return {
    degreeLevel: typeof value.degreeLevel === 'string' ? value.degreeLevel : undefined,
    endDate: typeof value.endDate === 'string' ? value.endDate : undefined,
    fieldOfStudy: typeof value.fieldOfStudy === 'string' ? value.fieldOfStudy : undefined,
    institutionName: typeof value.institutionName === 'string' ? value.institutionName : undefined,
    isInProgress: value.isInProgress === true,
    startDate: typeof value.startDate === 'string' ? value.startDate : undefined,
  };
}

function toWorkExperiencePayload(value: unknown): WorkExperiencePayload | null {
  if (!isObjectRecord(value)) {
    return null;
  }

  return {
    companyName: typeof value.companyName === 'string' ? value.companyName : undefined,
    endDate: typeof value.endDate === 'string' ? value.endDate : undefined,
    isCurrent: value.isCurrent === true,
    jobTitle: typeof value.jobTitle === 'string' ? value.jobTitle : undefined,
    responsibilities: typeof value.responsibilities === 'string' ? value.responsibilities : undefined,
    startDate: typeof value.startDate === 'string' ? value.startDate : undefined,
  };
}

/**
 * Actualizar nombre del usuario en user_profile
 */
export async function updateUserName(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { user, profile } = await getCurrentUser();

  if (!supabase || !user || !profile) {
    return { error: 'No autenticado' };
  }

  if (profile.user_role !== 'postulant') {
    return { error: 'No autorizado' };
  }

  const newName = formData.get('name') as string;

  if (!newName || newName.trim().length < 2) {
    return { error: 'El nombre debe tener al menos 2 caracteres' };
  }

  const { error } = await supabase
    .from('user_profile')
    .update({ name: newName.trim() })
    .eq('id', profile.id);

  if (error) {
    console.error('Error updating name:', error);
    return { error: 'Error al actualizar el nombre' };
  }

  revalidatePath('/dashboard/postulante');
  return { success: true };
}

/**
 * Subir CV general del usuario
 */
export async function uploadGeneralCV(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { user, profile } = await getCurrentUser();

  if (!supabase || !user || !profile) {
    return { error: 'No autenticado' };
  }

  if (profile.user_role !== 'postulant') {
    return { error: 'No autorizado' };
  }

  const file = formData.get('cv') as File;
  const positionIdStr = formData.get('position_id') as string | null;
  const locationIdStr = formData.get('location_id') as string | null;
  const positionId = positionIdStr ? parseInt(positionIdStr) : null;
  const locationId = locationIdStr ? parseInt(locationIdStr) : null;

  const fileError = validateCVFile(file);
  if (fileError) return { error: fileError };

  if (!positionId || !locationId) {
    return { error: 'Selecciona una posición y ubicación para registrarte en el Banco de talentos' };
  }

  const fileExt = file.name.split('.').pop();
  const filePath = `${user.id}/${Date.now()}-general_cv.${fileExt}`;
  const bucketName = CV_BUCKET;

  // Subir archivo a Supabase Storage (usa anon key, RLS enforced)
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    return { error: 'Error al subir el archivo' };
  }

  // Verificar si ya existe un CV general y eliminarlo
  const { data: existingCV } = await supabase
    .from('candidate_cvs')
    .select('id, path')
    .eq('user_id', profile.id)
    .eq('cv_type', 'general')
    .single();

  if (existingCV) {
    // Eliminar archivo anterior del storage
    await supabase.storage
      .from(bucketName)
      .remove([existingCV.path]);

    // Eliminar talent pool entry (will be recreated)
    await supabase
      .from('talent_pool_cv')
      .delete()
      .eq('cv_id', existingCV.id);

    // Eliminar registro anterior
    await supabase
      .from('candidate_cvs')
      .delete()
      .eq('id', existingCV.id);
  }

  // Insertar nuevo registro en candidate_cvs
  // user_id = user_profile.id, path = filePath (auth.uid()/timestamp-filename)
  const { data: insertedCV, error: insertError } = await supabase
    .from('candidate_cvs')
    .insert({
      user_id: profile.id,
      cv_type: 'general',
      bucket: bucketName,
      path: filePath,
      mime_type: file.type,
      file_size_bytes: file.size
    })
    .select('id')
    .single();

  if (insertError || !insertedCV) {
    console.error('Error inserting CV record:', insertError);
    // Intentar limpiar el archivo subido
    await supabase.storage.from(bucketName).remove([filePath]);
    return { error: 'Error al registrar tu perfil en Banco de talentos' };
  }

  // Crear entrada en talent_pool_cv con posición y ubicación
  const { error: talentPoolError } = await supabase
    .from('talent_pool_cv')
    .insert({
      user_id: profile.id,
      cv_id: insertedCV.id,
      position_id: positionId,
      location_id: locationId
    });

  if (talentPoolError) {
    console.error('Error creating talent pool entry:', talentPoolError);
    // Revertir insert de CV para evitar registros huérfanos
    await supabase.from('candidate_cvs').delete().eq('id', insertedCV.id);
    await supabase.storage.from(bucketName).remove([filePath]);
    return { error: 'Error al registrarte en el Banco de talentos. Intenta de nuevo.' };
  }

  revalidatePath('/dashboard/postulante');
  return { success: true };
}

/**
 * Eliminar cuenta del usuario
 * Requiere confirmación con el nombre completo
 */
export async function deleteAccount(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { user, profile } = await getCurrentUser();

  if (!supabase || !user || !profile) {
    return { error: 'No autenticado' };
  }

  if (profile.user_role !== 'postulant') {
    return { error: 'No autorizado' };
  }

  const confirmName = formData.get('confirmName') as string;

  if (!confirmName || confirmName.trim() !== profile.name) {
    return { error: 'El nombre no coincide. Escribe tu nombre completo exactamente como aparece.' };
  }

  // Eliminar CVs del storage
  const { data: cvs } = await supabase
    .from('candidate_cvs')
    .select('bucket, path')
    .eq('user_id', profile.id);

  if (cvs && cvs.length > 0) {
    for (const cv of cvs) {
      await supabase.storage.from(cv.bucket).remove([cv.path]);
    }
  }

  // Eliminar el usuario de auth (esto activará el CASCADE para user_profile y relacionados)
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

  // Si no tenemos permisos de admin, intentar con el método del cliente
  if (deleteError) {
    // Marcar como inactivo si no podemos eliminar completamente
    const { error: updateError } = await supabase
      .from('user_profile')
      .update({ is_active: false })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error deactivating account:', updateError);
      return { error: 'Error al eliminar la cuenta' };
    }

    // Cerrar sesión
    await supabase.auth.signOut();
    redirect('/');
  }

  // Cerrar sesión y redirigir
  await supabase.auth.signOut();
  redirect('/');
}

/**
 * Subir CV específico para una postulación
 * El CV se guarda como job_specific y luego se vincula a job_application.cv_id
 */
export async function uploadJobSpecificCV(formData: FormData): Promise<ActionResult & { cvId?: number }> {
  const supabase = await createClient();
  const { user, profile } = await getCurrentUser();

  if (!supabase || !user || !profile) {
    return { error: 'No autenticado' };
  }

  if (profile.user_role !== 'postulant') {
    return { error: 'No autorizado' };
  }

  const file = formData.get('cv') as File;

  const fileError = validateCVFile(file);
  if (fileError) return { error: fileError };

  const fileExt = file.name.split('.').pop();
  const filePath = `${user.id}/${Date.now()}-cv.${fileExt}`;
  const bucketName = CV_BUCKET;

  // Subir archivo a Supabase Storage (usa anon key, RLS enforced)
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    return { error: 'Error al subir el archivo' };
  }

  // Insertar nuevo registro en candidate_cvs (sin job_id, se vincula via job_application.cv_id)
  const { data: insertedCV, error: insertError } = await supabase
    .from('candidate_cvs')
    .insert({
      user_id: profile.id,
      cv_type: 'job_specific',
      bucket: bucketName,
      path: filePath,
      mime_type: file.type,
      file_size_bytes: file.size
    })
    .select('id')
    .single();

  if (insertError || !insertedCV) {
    console.error('Error inserting CV record:', insertError);
    // Intentar limpiar el archivo subido
    await supabase.storage.from(bucketName).remove([filePath]);
    return { error: 'Error al registrar el CV' };
  }

  return { success: true, cvId: insertedCV.id };
}

/**
 * Crear una postulación a un trabajo
 */
export async function submitJobApplication(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { user, profile } = await getCurrentUser();

  if (!supabase || !user || !profile) {
    return { error: 'No autenticado' };
  }

  if (profile.user_role !== 'postulant') {
    return { error: 'No autorizado' };
  }

  const jobId = formData.get('jobId') as string;
  const cvId = formData.get('cvId') as string;
  const useGeneralCV = formData.get('useGeneralCV') === 'true';
  
  // Extract required applicant data from formData
  const fullName = formData.get('fullName') as string;
  const idNumber = formData.get('idNumber') as string;
  const phone = formData.get('phone') as string;
  const provinceCode = formData.get('provinceCode') as string;
  const cantonCode = formData.get('cantonCode') as string;
  const addressDetail = formData.get('addressDetail') as string;
  const educationJSON = formData.get('education') as string;
  const workExperienceJSON = formData.get('workExperience') as string;

  if (!jobId) {
    return { error: 'ID de trabajo no proporcionado' };
  }

  // Validate required fields according to DB schema
  if (!fullName || fullName.trim().length < 5) {
    return { error: 'El nombre completo debe tener al menos 5 caracteres' };
  }

  const digitsOnly = idNumber.replace(/\D/g, '');
  if (digitsOnly.length < 9 || digitsOnly.length > 12) {
    return { error: 'La cédula debe tener entre 9 y 12 dígitos' };
  }

  if (!phone || !phone.match(/^[0-9+]{8,15}$/)) {
    return { error: 'El teléfono debe tener entre 8 y 15 caracteres' };
  }

  if (!provinceCode || !cantonCode) {
    return { error: 'Debes seleccionar provincia y cantón' };
  }

  let finalCvId: number;

  if (useGeneralCV) {
    // Obtener el CV general del usuario
    const { data: generalCV, error: cvError } = await supabase
      .from('candidate_cvs')
      .select('id')
      .eq('user_id', profile.id)
      .eq('cv_type', 'general')
      .single();

    if (cvError || !generalCV) {
      return { error: 'No tienes un perfil registrado en Banco de talentos. Regístralo primero.' };
    }

    finalCvId = generalCV.id;
  } else if (cvId) {
    finalCvId = parseInt(cvId);
  } else {
    return { error: 'Debes proporcionar un CV para la postulación' };
  }

  // Verificar que no exista ya una postulación a este trabajo
  const { data: existingApp } = await supabase
    .from('job_application')
    .select('id')
    .eq('user_id', profile.id)
    .eq('job_id', parseInt(jobId))
    .single();

  if (existingApp) {
    return { error: 'Ya te has postulado a esta vacante' };
  }

  // Crear la postulación con todos los campos requeridos
  const { data: newApplication, error: appError } = await supabase
    .from('job_application')
    .insert({
      user_id: profile.id,
      job_id: parseInt(jobId),
      cv_id: finalCvId,
      status: 'received',
      applicant_full_name: fullName.trim(),
      applicant_id_number: idNumber,
      applicant_phone: phone,
      residence_province_code: parseInt(provinceCode),
      residence_canton_code: parseInt(cantonCode),
      residence_detail: addressDetail || null
    })
    .select('id')
    .single();

  if (appError) {
    console.error('Error creating application:', appError);
    return { error: 'Error al crear la postulación' };
  }

  // Insert education records if provided
  if (educationJSON && newApplication) {
    try {
      const education = JSON.parse(educationJSON) as unknown;
      if (Array.isArray(education) && education.length > 0) {
        const educationRecords = education.flatMap((entry) => {
          const edu = toEducationPayload(entry);
          if (!edu?.institutionName || !edu.degreeLevel) {
            return [];
          }

          return [{
            application_id: newApplication.id,
            institution_name: edu.institutionName,
            degree_level: edu.degreeLevel,
            field_of_study: edu.fieldOfStudy || null,
            start_date: edu.startDate || null,
            end_date: edu.endDate || null,
            is_in_progress: edu.isInProgress || false,
          }];
        });

        const { error: eduError } = await supabase
          .from('job_application_education')
          .insert(educationRecords);

        if (eduError) {
          console.error('Error inserting education:', eduError);
        }
      }
    } catch (e) {
      console.error('Error parsing education JSON:', e);
    }
  }

  // Insert work experience records if provided
  if (workExperienceJSON && newApplication) {
    try {
      const workExperience = JSON.parse(workExperienceJSON) as unknown;
      if (Array.isArray(workExperience) && workExperience.length > 0) {
        const workRecords = workExperience
          .map((entry) => toWorkExperiencePayload(entry))
          .filter((work): work is WorkExperiencePayload => {
            if (!work) {
              return false;
            }
            // Validate required fields
            if (!work.companyName || !work.jobTitle || !work.startDate) {
              return false;
            }
            // Validate dates: if not current and has end_date, start must be before end
            if (!work.isCurrent && work.endDate) {
              const start = new Date(work.startDate);
              const end = new Date(work.endDate);
              if (start >= end) {
                console.warn('Invalid work dates: start >= end', work);
                return false;
              }
            }
            return true;
          })
          .map((work) => ({
            application_id: newApplication.id,
            company_name: work.companyName,
            job_title: work.jobTitle,
            start_date: work.startDate,
            end_date: work.endDate || null,
            is_current: work.isCurrent || false,
            responsibilities: work.responsibilities || null
          }));

        if (workRecords.length > 0) {
          const { error: workError } = await supabase
            .from('job_application_work_experience')
            .insert(workRecords);

          if (workError) {
            console.error('Error inserting work experience:', workError);
          }
        }
      }
    } catch (e) {
      console.error('Error parsing work experience JSON:', e);
    }
  }

  revalidatePath('/dashboard/postulante');
  revalidatePath('/buscar-empleos');
  return { success: true };
}

/**
 * Guardar respuestas a preguntas de un trabajo
 */
export async function saveJobAnswers(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { user, profile } = await getCurrentUser();

  if (!supabase || !user || !profile) {
    return { error: 'No autenticado' };
  }

  if (profile.user_role !== 'postulant') {
    return { error: 'No autorizado' };
  }

  // Obtener las respuestas del formData (formato: answer_{questionId})
  const answers: { question_id: number; value: string; user_id: string }[] = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith('answer_')) {
      const questionId = parseInt(key.replace('answer_', ''));
      if (!isNaN(questionId) && typeof value === 'string' && value.trim()) {
        answers.push({
          question_id: questionId,
          value: value.trim(),
          user_id: profile.id
        });
      }
    }
  }

  if (answers.length === 0) {
    return { success: true }; // No hay respuestas que guardar
  }

  // Validar formato de respuestas contra la pregunta
  const { data: questionFormats, error: questionError } = await supabase
    .from('question')
    .select('id, expected_format, description')
    .in('id', answers.map((a) => a.question_id));

  if (questionError) {
    console.error('Error fetching question formats:', questionError);
    return { error: 'Error al validar preguntas' };
  }

  const formatMap = new Map<number, { format: QuestionFormat; description: string }>();
  (questionFormats || []).forEach((q) =>
    formatMap.set(q.id, { format: (q.expected_format as QuestionFormat) || 'text', description: (q.description as string) || 'La pregunta' })
  );

  for (const answer of answers) {
    const info = formatMap.get(answer.question_id) || { format: 'text' as QuestionFormat, description: 'La pregunta' };
    const expected = info.format;
    const trimmed = answer.value.trim();
    const numeric = Number(trimmed);

    switch (expected) {
      case 'int':
        if (!Number.isInteger(numeric)) {
          return { error: `La pregunta "${info.description}" necesita un número entero.` };
        }
        break;
      case 'decimal':
        if (Number.isNaN(numeric)) {
          return { error: `La pregunta "${info.description}" necesita un número.` };
        }
        break;
      case 'boolean':
        if (trimmed !== 'true' && trimmed !== 'false') {
          return { error: `La pregunta "${info.description}" se responde con Sí o No.` };
        }
        break;
      case 'date':
        if (Number.isNaN(Date.parse(trimmed))) {
          return { error: `La pregunta "${info.description}" necesita una fecha válida.` };
        }
        break;
      default:
        break;
    }
  }

  const questionIds = answers.map((answer) => answer.question_id);
  const { error: deleteError } = await supabase
    .from('answer')
    .delete()
    .eq('user_id', profile.id)
    .in('question_id', questionIds);

  if (deleteError) {
    console.error('Error removing previous answers:', deleteError);
    return { error: 'Error al actualizar las respuestas' };
  }

  // Insertar las respuestas
  const { error } = await supabase
    .from('answer')
    .insert(answers);

  if (error) {
    console.error('Error saving answers:', error);
    return { error: 'Error al guardar las respuestas' };
  }

  return { success: true };
}

/**
 * Obtener URL firmada para descargar/previsualizar un CV
 * Funciona tanto para postulantes (sus propios CVs) como para HR/Admin (cualquier CV)
 */
export async function getCVDownloadUrl(cvId: number): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { user, profile } = await getCurrentUser();

  if (!supabase || !user || !profile) {
    return { error: 'No autenticado' };
  }

  // Obtener la información del CV desde candidate_cvs
  // RLS se encarga de que solo puedas ver tus propios CVs o todos si eres HR/Admin
  const { data: cv, error: cvError } = await supabase
    .from('candidate_cvs')
    .select('bucket, path, user_id')
    .eq('id', cvId)
    .single();

  if (cvError || !cv) {
    console.error('Error fetching CV:', cvError);
    return { error: 'CV no encontrado o sin permisos' };
  }

  // Generar URL firmada (expira en 1 hora)
  const { data: signedUrl, error: signError } = await supabase.storage
    .from(cv.bucket)
    .createSignedUrl(cv.path, 3600);

  if (signedUrl?.signedUrl) {
    return { url: signedUrl.signedUrl };
  }

  const storageError = signError as StorageErrorShape | null;
  const isNotFound = storageError?.status === 400 || storageError?.statusCode === '404';
  console.error('Error generating signed URL:', signError);
  return {
    error: isNotFound
      ? 'El archivo de CV no está disponible en el almacenamiento. Sube tu CV nuevamente.'
      : 'Error al generar URL de descarga',
  };
}

/**
 * Obtener el CV general del usuario actual
 */
export async function getGeneralCV(): Promise<{ cv?: { id: number; path: string; mime_type: string; file_size_bytes: number; created_at: string }; error?: string }> {
  const supabase = await createClient();
  const { user, profile } = await getCurrentUser();

  if (!supabase || !user || !profile) {
    return { error: 'No autenticado' };
  }

  const { data: cv, error } = await supabase
    .from('candidate_cvs')
    .select('id, path, mime_type, file_size_bytes, created_at')
    .eq('user_id', profile.id)
    .eq('cv_type', 'general')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching general CV:', error);
    return { error: 'Error al obtener tu registro de Banco de talentos' };
  }

  return { cv: cv || undefined };
}
