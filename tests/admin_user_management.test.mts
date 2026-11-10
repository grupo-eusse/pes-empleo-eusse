import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const {
  buildAdminUserCreatePayload,
  parseAdminUserCreationForm,
} = await import(new URL("../lib/actions/admin_user_creation.ts", import.meta.url).href) as typeof import("../lib/actions/admin_user_creation");

const repoRoot = process.cwd();

function buildFormData(entries: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    formData.append(key, value);
  }

  return formData;
}

function run() {
  const parsed = parseAdminUserCreationForm(
    buildFormData({
      fullName: "  Laura Campos  ",
      email: "  Laura.Campos@Empresa.com  ",
      password: "  supersecret123  ",
      role: "hr",
    }),
  );

  assert.deepEqual(parsed, {
    fullName: "Laura Campos",
    email: "laura.campos@empresa.com",
    password: "supersecret123",
    role: "hr",
  });

  const invalidRole = parseAdminUserCreationForm(
    buildFormData({
      fullName: "Admin Temporal",
      email: "admin@empresa.com",
      password: "supersecret123",
      role: "postulant",
    }),
  );

  assert.ok("error" in invalidRole);
  assert.equal(invalidRole.error, "El rol debe ser hr o admin");

  const invalidPassword = parseAdminUserCreationForm(
    buildFormData({
      fullName: "Admin Temporal",
      email: "admin@empresa.com",
      password: "short",
      role: "admin",
    }),
  );

  assert.ok("error" in invalidPassword);
  assert.equal(invalidPassword.error, "La contraseña debe tener al menos 8 caracteres");

  const payload = buildAdminUserCreatePayload({
    fullName: "Laura Campos",
    email: "laura.campos@empresa.com",
    password: "supersecret123",
  });

  assert.deepEqual(payload, {
    email: "laura.campos@empresa.com",
    password: "supersecret123",
    email_confirm: true,
    user_metadata: {
      full_name: "Laura Campos",
    },
  });

  const rolesTabSource = readFileSync(
    path.join(repoRoot, "app", "dashboard", "(admin)", "configuracion", "components", "RolesTab.tsx"),
    "utf8",
  );
  const configuracionContentSource = readFileSync(
    path.join(repoRoot, "app", "dashboard", "(admin)", "configuracion", "configuracion_content.tsx"),
    "utf8",
  );
  const configuracionPageSource = readFileSync(
    path.join(repoRoot, "app", "dashboard", "(admin)", "configuracion", "page.tsx"),
    "utf8",
  );

  assert.match(rolesTabSource, /createAdminUser/);
  assert.match(rolesTabSource, /fullName/);
  assert.match(rolesTabSource, /password/);
  assert.doesNotMatch(rolesTabSource, /createInvite/);
  assert.doesNotMatch(rolesTabSource, /deleteInvite/);
  assert.doesNotMatch(rolesTabSource, /resendInvite/);
  assert.doesNotMatch(rolesTabSource, /Invitaci[oó]n/i);
  assert.doesNotMatch(configuracionContentSource, /initialInvites/);
  assert.doesNotMatch(configuracionContentSource, /\binvites\b/);
  assert.doesNotMatch(configuracionPageSource, /getInvites/);
}

try {
  run();
  console.log("admin_user_management: ok");
} catch (error) {
  console.error("admin_user_management: failed");
  throw error;
}
