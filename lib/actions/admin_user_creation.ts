import type { UserRole } from "@/types/auth";

export type ManagedAdminRole = Extract<UserRole, "hr" | "admin">;

export interface ParsedAdminUserCreation {
  fullName: string;
  email: string;
  password: string;
  role: ManagedAdminRole;
}

export function isManagedAdminRole(role: unknown): role is ManagedAdminRole {
  return role === "hr" || role === "admin";
}

export function parseAdminUserCreationForm(
  formData: FormData,
): ParsedAdminUserCreation | { error: string } {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const role = formData.get("role");

  if (!fullName || !email || !password || !role) {
    return { error: "Nombre, email, contraseña y rol son requeridos" };
  }

  if (!isManagedAdminRole(role)) {
    return { error: "El rol debe ser hr o admin" };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres" };
  }

  return {
    fullName,
    email,
    password,
    role,
  };
}

export function buildAdminUserCreatePayload({
  fullName,
  email,
  password,
}: Omit<ParsedAdminUserCreation, "role">) {
  return {
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  };
}
