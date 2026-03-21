"use client";

import { useState } from "react";
import {
  type UserProfileData,
  type UserInviteData,
} from "@/lib/actions/roles";
import {
  createCompany,
  updateCompany,
  deleteCompany,
  createLocation,
  updateLocation,
  deleteLocation,
  createPosition,
  updatePosition,
  deletePosition,
  togglePositionStatus,
  type CompanyData,
  type LocationData,
  type PositionData,
} from "@/lib/actions/config";
import { useMessages } from "@/lib/hooks/useMessages";
import { useTabs, TABS } from "@/lib/hooks/useTabs";
import RolesTab from "./components/RolesTab";
import CrudTab from "./components/CrudTab";

interface ConfiguracionContentProps {
  initialUsers: UserProfileData[];
  initialInvites: UserInviteData[];
  initialCompanies: CompanyData[];
  initialLocations: LocationData[];
  initialPositions: PositionData[];
  currentUserProfileId: string;
}

interface MessageFeedbackProps {
  error: string | null;
  success: string | null;
}

function MessageFeedback({ error, success }: MessageFeedbackProps) {
  return (
    <>
      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-green-700 text-sm">
          {success}
        </div>
      )}
    </>
  );
}

interface TabNavigationProps {
  activeTab: ReturnType<typeof useTabs>["activeTab"];
  onChange: ReturnType<typeof useTabs>["handleTabChange"];
}

function TabNavigation({ activeTab, onChange }: TabNavigationProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`rounded-2xl px-4 py-2 text-sm font-medium transition-all ${
            activeTab === tab.id
              ? "bg-brand-400 text-white shadow-lg"
              : "bg-white text-brand-900 hover:bg-brand-100"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default function ConfiguracionContent({
  initialUsers,
  initialInvites,
  initialCompanies,
  initialLocations,
  initialPositions,
  currentUserProfileId,
}: ConfiguracionContentProps) {
  // State
  const [users, setUsers] = useState<UserProfileData[]>(initialUsers);
  const [invites, setInvites] = useState<UserInviteData[]>(initialInvites);
  const [companies, setCompanies] = useState<CompanyData[]>(initialCompanies);
  const [locations, setLocations] = useState<LocationData[]>(initialLocations);
  const [positions, setPositions] = useState<PositionData[]>(initialPositions);

  // Hooks
  const { activeTab, handleTabChange } = useTabs();
  const { error, success, showError, showSuccess } = useMessages();

  return (
    <div className="space-y-6 text-brand-900">
      <MessageFeedback error={error} success={success} />
      <TabNavigation activeTab={activeTab} onChange={handleTabChange} />

      {/* ROLES TAB */}
      {activeTab === "roles" && (
        <RolesTab
          users={users}
          invites={invites}
          currentUserProfileId={currentUserProfileId}
          onShowMessage={(type, message) => type === "error" ? showError(message) : showSuccess(message)}
          onUpdateUsers={setUsers}
          onUpdateInvites={setInvites}
        />
      )}

      {/* COMPANIES TAB */}
      {activeTab === "companies" && (
        <CrudTab<CompanyData>
          title="Compañías"
          items={companies}
          itemName="compañía"
          fieldName="name"
          placeholder="Escribí el nombre de la compañía"
          showActiveStatus={false}
          onShowMessage={(type, message) => type === "error" ? showError(message) : showSuccess(message)}
          onUpdateItems={setCompanies}
          onCreate={createCompany}
          onUpdate={updateCompany}
          onDelete={deleteCompany}
        />
      )}

      {/* LOCATIONS TAB */}
      {activeTab === "locations" && (
        <CrudTab<LocationData>
          title="Ubicaciones"
          items={locations}
          itemName="ubicación"
          fieldName="name"
          placeholder="Escribí el nombre de la ubicación"
          showActiveStatus={false}
          onShowMessage={(type, message) => type === "error" ? showError(message) : showSuccess(message)}
          onUpdateItems={setLocations}
          onCreate={createLocation}
          onUpdate={updateLocation}
          onDelete={deleteLocation}
        />
      )}

      {/* POSITIONS TAB */}
      {activeTab === "positions" && (
        <CrudTab<PositionData>
          title="Posiciones"
          items={positions}
          itemName="posición"
          fieldName="description"
          placeholder="Escribí la descripción de la posición"
          showActiveStatus={true}
          onShowMessage={(type, message) => type === "error" ? showError(message) : showSuccess(message)}
          onUpdateItems={setPositions}
          onCreate={createPosition}
          onUpdate={updatePosition}
          onDelete={deletePosition}
          onToggleStatus={togglePositionStatus}
        />
      )}
    </div>
  );
}

