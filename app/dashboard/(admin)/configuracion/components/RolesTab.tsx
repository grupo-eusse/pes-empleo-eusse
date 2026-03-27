"use client";

import { useState, useTransition } from "react";
import type { UserRole } from "@/types/auth";
import {
  createAdminUser,
  updateUserRole,
  toggleUserStatus,
  type UserProfileData,
} from "@/lib/actions/roles";
import PasswordInput from "@/ui/components/password_input";

interface RolesTabProps {
  users: UserProfileData[];
  currentUserProfileId: string;
  onShowMessage: (type: "error" | "success", message: string) => void;
  onUpdateUsers: (updater: (users: UserProfileData[]) => UserProfileData[]) => void;
}

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: "Administrador",
  hr: "RRHH",
  postulant: "Postulante",
};

export default function RolesTab({
  users,
  currentUserProfileId,
  onShowMessage,
  onUpdateUsers,
}: RolesTabProps) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "hr" as Extract<UserRole, "hr" | "admin">,
  });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("fullName", form.fullName);
    formData.append("email", form.email);
    formData.append("password", form.password);
    formData.append("role", form.role);

    startTransition(async () => {
      const result = await createAdminUser(formData);
      if (result.error) {
        onShowMessage("error", result.error);
        return;
      }

      if (result.user) {
        onUpdateUsers((prev) => [result.user!, ...prev]);
      }

      setForm({ fullName: "", email: "", password: "", role: "hr" });
      onShowMessage("success", "Usuario creado correctamente");
    });
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUserProfileId) {
      onShowMessage("error", "No puedes desactivar tu propia cuenta");
      return;
    }

    startTransition(async () => {
      const result = await toggleUserStatus(userId, !currentStatus);
      if (result.error) {
        onShowMessage("error", result.error);
      } else {
        onUpdateUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u)),
        );
        onShowMessage("success", `Usuario ${!currentStatus ? "activado" : "desactivado"} correctamente`);
      }
    });
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userId === currentUserProfileId) {
      onShowMessage("error", "No puedes cambiar tu propio rol");
      return;
    }

    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result.error) {
        onShowMessage("error", result.error);
      } else {
        onUpdateUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, user_role: newRole } : u)),
        );
        setEditingUser(null);
        onShowMessage("success", "Rol actualizado correctamente");
      }
    });
  };

  return (
    <>
      <section className="rounded-3xl border border-transparent bg-white p-6 shadow-[0_25px_70px_rgba(0,0,0,0.06)]">
        <h2 className="text-lg font-semibold text-brand-900">Crear usuario administrativo</h2>
        <p className="text-sm text-brand-900/70">
          Crea cuentas de RRHH o administrador manualmente. El acceso queda activo de inmediato y no requiere confirmar correo.
        </p>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleCreateUser}>
          <label className="text-sm text-brand-900/70">
            Nombre completo
            <input
              required
              type="text"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              disabled={isPending}
              className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40 disabled:opacity-50"
            />
          </label>
          <label className="text-sm text-brand-900/70">
            Correo corporativo
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              disabled={isPending}
              className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40 disabled:opacity-50"
            />
          </label>
          <PasswordInput
            required
            minLength={8}
            label="Contraseña"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            autoComplete="new-password"
            disabled={isPending}
          />
          <label className="text-sm text-brand-900/70">
            Rol
            <select
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as Extract<UserRole, "hr" | "admin"> }))}
              disabled={isPending}
              className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40 disabled:opacity-50"
            >
              <option value="admin">Administrador</option>
              <option value="hr">RRHH</option>
            </select>
          </label>
          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-2xl bg-brand-400 px-6 py-2 text-sm font-semibold text-brand-50 shadow-[0_20px_55px_rgba(0,0,0,0.12)] disabled:opacity-50"
            >
              {isPending ? "Creando..." : "Crear usuario"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-transparent bg-white p-6 shadow-[0_25px_70px_rgba(0,0,0,0.06)]">
        <h2 className="text-lg font-semibold text-brand-900">Usuarios del sistema</h2>
        <p className="mb-4 text-sm text-brand-900/70">
          Usuarios con rol de administrador o RRHH
        </p>
        <div className="mt-4 overflow-x-auto">
          {users.length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-900/60">
              No hay usuarios registrados con roles administrativos
            </p>
          ) : (
            <table className="min-w-full divide-y divide-brand-50 text-sm">
              <thead className="bg-brand-50 text-left text-xs uppercase tracking-widest text-brand-900/60">
                <tr>
                  <th className="px-3 py-3">Nombre</th>
                  <th className="px-3 py-3">Rol</th>
                  <th className="px-3 py-3">Fecha de registro</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50/80">
                {users.map((user) => (
                  <tr key={user.id} className={user.id === currentUserProfileId ? "bg-brand-50/50" : ""}>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-brand-900">
                        {user.name || "Sin nombre"}
                        {user.id === currentUserProfileId && (
                          <span className="ml-2 text-xs text-brand-400">(Tu)</span>
                        )}
                      </p>
                      <p className="text-xs text-brand-900/60">{user.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      {editingUser === user.id ? (
                        <select
                          value={user.user_role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          disabled={isPending}
                          className="rounded-xl border border-brand-200 bg-white px-2 py-1 text-sm"
                        >
                          <option value="admin">Administrador</option>
                          <option value="hr">RRHH</option>
                        </select>
                      ) : (
                        ROLE_DISPLAY_NAMES[user.user_role]
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-brand-900/60">
                      {new Date(user.created_at).toLocaleDateString("es-CR")}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.is_active
                            ? "bg-brand-400/25 text-brand-900"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {user.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        {user.id !== currentUserProfileId && (
                          <>
                            <button
                              onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                              disabled={isPending}
                              className="rounded-full border border-transparent bg-brand-50 px-3 py-1 text-xs text-brand-900 shadow-[0_8px_20px_rgba(0,0,0,0.05)] disabled:opacity-50"
                            >
                              {editingUser === user.id ? "Cancelar" : "Editar rol"}
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user.id, user.is_active)}
                              disabled={isPending}
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                user.is_active
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-green-50 text-green-700"
                              } disabled:opacity-50`}
                            >
                              {user.is_active ? "Desactivar" : "Activar"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}
