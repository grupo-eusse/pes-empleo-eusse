import { getGeneralCvs, type GeneralCvData } from "@/lib/actions/resumes";
import ResumesContent from "./resumes_content";

export default async function ResumesPage() {
  let initialCvs: GeneralCvData[] = [];
  let initialError: string | null = null;

  try {
    const { data, error } = await getGeneralCvs();
    initialCvs = data || [];
    initialError = error || null;
  } catch {
    initialError = "Error al cargar los CVs. Intenta recargar la página.";
  }

  return (
    <ResumesContent
      initialCvs={initialCvs}
      initialError={initialError}
    />
  );
}
