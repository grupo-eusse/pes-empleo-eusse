import type { ApplicationStatus } from "@/lib/constants";
import type { ApplicationNoteData } from "@/lib/application_note_types";

type ApplicationStatusRecord = {
  id: number;
  status: ApplicationStatus;
  status_changed_at: string;
};

type ApplicationNotesRecord = {
  id: number;
  notes?: ApplicationNoteData[];
};

export function updateApplicationStatusInRecord<T extends ApplicationStatusRecord>(
  record: T | null,
  applicationId: number,
  status: ApplicationStatus,
  statusChangedAt: string,
): T | null {
  if (!record || record.id !== applicationId) {
    return record;
  }

  return {
    ...record,
    status,
    status_changed_at: statusChangedAt,
  };
}

export function updateApplicationStatusInList<T extends ApplicationStatusRecord>(
  applications: T[],
  applicationId: number,
  status: ApplicationStatus,
  statusChangedAt: string,
): T[] {
  return applications.map((application) =>
    updateApplicationStatusInRecord(application, applicationId, status, statusChangedAt) ?? application,
  );
}

export function updateApplicationNotesInRecord<T extends ApplicationNotesRecord>(
  record: T | null,
  applicationId: number,
  notes: ApplicationNoteData[],
): T | null {
  if (!record || record.id !== applicationId) {
    return record;
  }

  return {
    ...record,
    notes,
  };
}

export function updateApplicationNotesInList<T extends ApplicationNotesRecord>(
  applications: T[],
  applicationId: number,
  notes: ApplicationNoteData[],
): T[] {
  return applications.map((application) =>
    updateApplicationNotesInRecord(application, applicationId, notes) ?? application,
  );
}
