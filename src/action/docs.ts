"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DocsStatus } from "@/types";

interface StepPayload {
  key: string;
  id?: string;
  title: string;
  description: string;
  step_order: number;
  existingImage: string | null;
}

async function uploadImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  docsId: string,
  file: File
) {
  const ext = file.name.split(".").pop();
  const path = `${docsId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("step-images")
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("step-images").getPublicUrl(path);
  return data.publicUrl;
}

async function removeImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  url: string | null | undefined
) {
  if (!url) return;
  const path = url.split("/step-images/")[1];
  if (path) await supabase.storage.from("step-images").remove([path]);
}

function parseDocsPayload(formData: FormData) {
  const docs_name = String(formData.get("docs_name") ?? "").trim();
  if (!docs_name) throw new Error("Nama docs wajib diisi.");

  return {
    docs_name,
    description: String(formData.get("description") ?? ""),
    link_app: String(formData.get("link_app") ?? ""),
    link_youtube: String(formData.get("link_youtube") ?? ""),
    status: (formData.get("status") as DocsStatus) ?? "draft",
  };
}

export async function createDocsAction(formData: FormData) {
  const supabase = await createClient();
  const docsPayload = parseDocsPayload(formData);

  const { data: docs, error } = await supabase
    .from("docs")
    .insert(docsPayload)
    .select()
    .single();
  if (error) throw error;

  const steps: StepPayload[] = JSON.parse(String(formData.get("steps") ?? "[]"));

  for (const step of steps) {
    const file = formData.get(`image_${step.key}`) as File | null;
    let imageUrl = step.existingImage;
    if (file && file.size > 0) {
      imageUrl = await uploadImage(supabase, docs.id, file);
    }

    await supabase.from("step").insert({
      title: step.title,
      description: step.description,
      step_order: step.step_order,
      image: imageUrl,
      docs_id: docs.id,
    });
  }

  revalidatePath("/admin/docs");
  redirect("/admin/docs");
}

export async function updateDocsAction(docsId: string, formData: FormData) {
  const supabase = await createClient();
  const docsPayload = parseDocsPayload(formData);

  const { error } = await supabase
    .from("docs")
    .update(docsPayload)
    .eq("id", docsId);
  if (error) throw error;

  const steps: StepPayload[] = JSON.parse(String(formData.get("steps") ?? "[]"));
  const removedStepIds: string[] = JSON.parse(
    String(formData.get("removedStepIds") ?? "[]")
  );

  for (const removedId of removedStepIds) {
    const { data: removedStep } = await supabase
      .from("step")
      .select("image")
      .eq("id", removedId)
      .single();
    await removeImage(supabase, removedStep?.image);
    await supabase.from("step").delete().eq("id", removedId);
  }

  for (const step of steps) {
    const file = formData.get(`image_${step.key}`) as File | null;
    let imageUrl = step.existingImage;
    if (file && file.size > 0) {
      imageUrl = await uploadImage(supabase, docsId, file);
    }

    const payload = {
      title: step.title,
      description: step.description,
      step_order: step.step_order,
      image: imageUrl,
      docs_id: docsId,
    };

    if (step.id) {
      await supabase.from("step").update(payload).eq("id", step.id);
    } else {
      await supabase.from("step").insert(payload);
    }
  }

  revalidatePath("/admin/docs");
  redirect("/admin/docs");
}

export async function deleteDocsAction(docsId: string) {
  const supabase = await createClient();

  const { data: stepsData } = await supabase
    .from("step")
    .select("image")
    .eq("docs_id", docsId);

  for (const s of stepsData ?? []) {
    await removeImage(supabase, s.image);
  }

  await supabase.from("docs").delete().eq("id", docsId);
  revalidatePath("/admin/docs");
}