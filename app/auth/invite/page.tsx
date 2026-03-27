import { redirect } from "next/navigation";
import InviteAuthContent from "./invite_auth_content";
import { getSafeInternalPath } from "@/lib/invite_registration_utils";

type SearchParams = Promise<{
  next?: string;
  code?: string;
}>;

export default async function InviteAuthPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = getSafeInternalPath(resolvedSearchParams.next) ?? "";

  if (resolvedSearchParams.code) {
    redirect(`/auth/callback?code=${resolvedSearchParams.code}&next=${nextPath}`);
  }

  return <InviteAuthContent nextPath={nextPath} />;
}
