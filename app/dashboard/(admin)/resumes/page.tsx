import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getGeneralCvs } from "@/lib/actions/resumes";
import ResumesContent from "./resumes_content";

export default async function ResumesPage() {
  const { user, profile } = await getCurrentUser();

  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.user_role !== "hr" && profile.user_role !== "admin") {
    redirect("/dashboard/postulante");
  }

  const { data, error } = await getGeneralCvs();

  return <ResumesContent initialCvs={data || []} initialError={error || null} />;
}
