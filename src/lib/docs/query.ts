import { createClient } from "@/lib/supabase/server";
import { Docs, Step } from "@/types";

export async function getAllDocs(): Promise<Docs[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("docs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllDocs error:", error);
    return [];
  }
  return (data as Docs[]) ?? [];
}

export async function getDocsById(id: string): Promise<Docs | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("docs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("getDocsById error:", error);
    return null;
  }
  return data as Docs;
}

export interface DocsWithSteps extends Docs {
  steps: Step[];
}

export async function getDocsWithSteps(id: string): Promise<DocsWithSteps | null> {
  const supabase = await createClient();

  const { data: docs, error: docsError } = await supabase
    .from("docs")
    .select("*")
    .eq("id", id)
    .single();

  if (docsError || !docs) {
    console.error("getDocsWithSteps error:", docsError);
    return null;
  }

  const { data: steps, error: stepsError } = await supabase
    .from("step")
    .select("*")
    .eq("docs_id", id)
    .order("step_order", { ascending: true });

  if (stepsError) {
    console.error("getDocsWithSteps (steps) error:", stepsError);
  }

  return { ...(docs as Docs), steps: (steps as Step[]) ?? [] };
}