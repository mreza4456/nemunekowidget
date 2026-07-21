export type DocsStatus = "draft" | "published" | "archived";

export interface Docs {
  id: string;
  docs_name: string;
  description: string | null;
  link_youtube: string | null;
  link_app: string | null;
  status: DocsStatus;
  created_at: string;
}

export interface Step {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  docs_id: string;
  step_order: number;
  created_at: string;
}