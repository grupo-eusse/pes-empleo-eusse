export type JobStatus = 'draft' | 'pending' | 'active' | 'paused' | 'closed';

export type QuestionFormat = 'text' | 'int' | 'decimal' | 'boolean' | 'date';

export interface CompanyData {
  id: number;
  name: string;
  created_at: string;
}

export interface LocationData {
  id: number;
  name: string;
  created_at: string;
}

export interface PositionData {
  id: number;
  description: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
}

export interface QuestionData {
  id: number;
  description: string;
  job_id: number;
  created_at: string;
  expected_format?: QuestionFormat;
}

export interface JobData {
  id: number;
  created_at: string;
  company: number;
  location: number;
  title: string;
  description: string;
  status: JobStatus;
  deactivated_at: string | null;
  activate_at: string | null;
  created_by: string;
  // Joined data
  company_data?: CompanyData;
  location_data?: LocationData;
  questions?: QuestionData[];
  applicants_count?: number;
}
