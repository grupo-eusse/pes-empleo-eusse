export interface ApplicationNoteData {
  id: number;
  application_id: number;
  author_id: string;
  reply_to_id: number | null;
  body: string;
  created_at: string;
  author?: {
    id: string;
    name: string;
  };
  replies?: ApplicationNoteData[];
}
