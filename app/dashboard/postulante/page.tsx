import { createClient, getCurrentUser } from "@/lib/supabase/server";
import PostulantDashboardContent, {
  type JobApplicationWithDetails,
  type CandidateCVGeneral,
  type ApplicationStatusDB,
} from "./postulant_dashboard_content";

interface JobApplicationRow {
  id: number;
  status: ApplicationStatusDB;
  created_at: string;
  updated_at: string | null;
  status_changed_at: string;
  job: {
    id: number;
    title: string;
    description: string;
    company: { id: number; name: string } | { id: number; name: string }[];
    location: { id: number; name: string } | { id: number; name: string }[];
  } | null;
  cv: {
    id: number;
    path: string;
    mime_type: string;
  } | null;
}

function extractRelation<T>(rel: T | T[] | null | undefined): T | null {
  if (rel === null || rel === undefined) return null;
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel;
}

export default async function PostulantDashboard() {
  const supabase = await createClient();
  const { user, profile } = await getCurrentUser();

  if (!supabase || !user || !profile) {
    return (
      <div className="rounded-3xl border border-transparent bg-white p-8 text-center shadow-[0_25px_70px_rgba(0,0,0,0.06)]">
        <p className="text-brand-900/70">No se pudo cargar el panel del postulante.</p>
      </div>
    );
  }

  const { data: applicationsData, error: applicationsError } = await supabase
    .from("job_application")
    .select(`
      id,
      status,
      created_at,
      updated_at,
      status_changed_at,
      job:job_id (
        id,
        title,
        description,
        company:company (
          id,
          name
        ),
        location:location (
          id,
          name
        )
      ),
      cv:cv_id (
        id,
        path,
        mime_type
      )
    `)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  if (applicationsError) {
    console.error("Error fetching applications:", applicationsError);
  }

  const { data: generalCVData, error: cvError } = await supabase
    .from("candidate_cvs")
    .select("id, path, bucket, mime_type, file_size_bytes, created_at")
    .eq("user_id", profile.id)
    .eq("cv_type", "general")
    .single();

  if (cvError && cvError.code !== "PGRST116") {
    console.error("Error fetching general CV:", cvError);
  }

  const rawData = (applicationsData ?? []) as unknown as JobApplicationRow[];

  const applications: JobApplicationWithDetails[] = rawData.map((app) => {
    const job = extractRelation(app.job);
    const cv = extractRelation(app.cv);
    const company = job ? extractRelation(job.company) : null;
    const location = job ? extractRelation(job.location) : null;

    return {
      id: app.id,
      status: app.status,
      created_at: app.created_at,
      updated_at: app.updated_at,
      status_changed_at: app.status_changed_at,
      job: {
        id: job?.id ?? 0,
        title: job?.title ?? "Sin título",
        description: job?.description ?? "",
        company: {
          id: company?.id ?? 0,
          name: company?.name ?? "Empresa desconocida",
        },
        location: {
          id: location?.id ?? 0,
          name: location?.name ?? "Sin ubicación",
        },
      },
      cv: {
        id: cv?.id ?? 0,
        path: cv?.path ?? "",
        mime_type: cv?.mime_type ?? "",
      },
    };
  });

  const generalCV: CandidateCVGeneral | null = generalCVData
    ? {
        id: generalCVData.id,
        path: generalCVData.path,
        bucket: generalCVData.bucket,
        mime_type: generalCVData.mime_type,
        file_size_bytes: generalCVData.file_size_bytes,
        created_at: generalCVData.created_at,
      }
    : null;

  return (
    <PostulantDashboardContent
      profile={profile}
      userEmail={user.email ?? ""}
      applications={applications}
      generalCV={generalCV}
    />
  );
}
