export interface MappedGeneralCvData {
  id: number;
  user_id: string;
  cv_type: "general" | "job_specific";
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

type MaybeOneOrMany<T> = T | T[] | null | undefined;

interface CandidateRecord {
  id: string;
  name: string;
  supabase_id: string;
}

interface CandidateCvRecord extends Omit<MappedGeneralCvData, "candidate" | "talent_pool"> {
  candidate?: MaybeOneOrMany<CandidateRecord>;
}

interface TalentPoolEntryRecord {
  id: number;
  position?: MaybeOneOrMany<NonNullable<NonNullable<MappedGeneralCvData["talent_pool"]>["position"]>>;
  location?: MaybeOneOrMany<NonNullable<NonNullable<MappedGeneralCvData["talent_pool"]>["location"]>>;
  cv?: MaybeOneOrMany<CandidateCvRecord>;
}

function unwrapRelation<T>(value: MaybeOneOrMany<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function mapTalentPoolEntriesToGeneralCvs(
  entries: TalentPoolEntryRecord[] | null | undefined,
): MappedGeneralCvData[] {
  return (entries ?? []).flatMap((entry) => {
    const cv = unwrapRelation(entry.cv);

    if (!cv) {
      return [];
    }

    const candidate = unwrapRelation(cv.candidate);
    const position = unwrapRelation(entry.position);
    const location = unwrapRelation(entry.location);

    return [
      {
        ...cv,
        candidate: candidate ?? undefined,
        talent_pool: {
          id: entry.id,
          position_id: position?.id ?? null,
          location_id: location?.id ?? null,
          position: position ?? null,
          location: location ?? null,
        },
      },
    ];
  });
}
