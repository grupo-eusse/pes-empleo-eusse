import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const rangeDays = Math.min(
    365,
    Math.max(1, Number(request.nextUrl.searchParams.get("rangeDays")) || 30)
  );

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
  }

  const since = new Date();
  since.setDate(since.getDate() - rangeDays);
  const sinceISO = since.toISOString();

  // Fetch applications in the date range with joined job → company
  const { data: apps, error } = await supabase
    .from("job_application")
    .select(
      `
      id,
      status,
      created_at,
      status_changed_at,
      residence_province_code,
      job:job_id (
        id,
        company_data:company ( name )
      )
    `
    )
    .gte("created_at", sinceISO)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Metrics fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const applications = (apps || []) as unknown as Array<{
    id: number;
    status: ApplicationStatus;
    created_at: string;
    status_changed_at: string;
    residence_province_code: number;
    job?: { id: number; company_data?: { name: string } } | null;
  }>;

  const totalApplications = applications.length;

  // By status
  const byStatus: Record<string, number> = {};
  for (const app of applications) {
    byStatus[app.status] = (byStatus[app.status] || 0) + 1;
  }

  // Conversion ratios
  const contacted = byStatus["contacted"] || 0;
  const inReview = byStatus["in_review"] || 0;
  const rejected = byStatus["rejected"] || 0;

  const conversionContacted = totalApplications > 0 ? contacted / totalApplications : 0;
  const conversionInReview = totalApplications > 0 ? inReview / totalApplications : 0;
  const rejectedRatio = totalApplications > 0 ? rejected / totalApplications : 0;

  // Average hours between status transitions
  // received → in_review: diff between created_at and status_changed_at for apps in_review
  const inReviewApps = applications.filter((a) => a.status === "in_review");
  let avgHoursReceivedToReview: number | null = null;
  if (inReviewApps.length > 0) {
    const total = inReviewApps.reduce((sum, a) => {
      const created = new Date(a.created_at).getTime();
      const changed = new Date(a.status_changed_at).getTime();
      return sum + (changed - created);
    }, 0);
    avgHoursReceivedToReview = total / inReviewApps.length / 3600000;
  }

  // in_review → contacted
  const contactedApps = applications.filter((a) => a.status === "contacted");
  let avgHoursReviewToContact: number | null = null;
  if (contactedApps.length > 0) {
    const total = contactedApps.reduce((sum, a) => {
      const created = new Date(a.created_at).getTime();
      const changed = new Date(a.status_changed_at).getTime();
      return sum + (changed - created);
    }, 0);
    avgHoursReviewToContact = total / contactedApps.length / 3600000;
  }

  // Education & experience coverage – count apps that have related records
  const appIds = applications.map((a) => a.id);
  let withEducation = 0;
  let withExperience = 0;

  if (appIds.length > 0) {
    const [eduResult, expResult] = await Promise.all([
      supabase
        .from("job_application_education")
        .select("application_id")
        .in("application_id", appIds),
      supabase
        .from("job_application_work_experience")
        .select("application_id")
        .in("application_id", appIds),
    ]);

    withEducation = new Set((eduResult.data || []).map((r) => r.application_id)).size;
    withExperience = new Set((expResult.data || []).map((r) => r.application_id)).size;
  }

  // By company
  const byCompany: Record<string, number> = {};
  for (const app of applications) {
    const companyName =
      (app.job as { id: number; company_data?: { name: string } } | null)?.company_data?.name || "Sin empresa";
    byCompany[companyName] = (byCompany[companyName] || 0) + 1;
  }

  // By province
  const byProvince: Record<string, number> = {};
  for (const app of applications) {
    const code = app.residence_province_code?.toString() || "0";
    byProvince[code] = (byProvince[code] || 0) + 1;
  }

  // Contact SLA - hours to first contact (use avg)
  const contactSLAHours = avgHoursReviewToContact;

  return NextResponse.json({
    totalApplications,
    byStatus,
    contactSLAHours,
    conversionContacted,
    conversionInReview,
    rejectedRatio,
    avgHoursReceivedToReview,
    avgHoursReviewToContact,
    withEducation,
    withExperience,
    byCompany,
    byProvince,
    rangeDays,
  });
}
