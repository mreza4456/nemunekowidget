import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const BUCKET = "step-images";

/**
 * Upload satu file gambar ke Supabase Storage dan kembalikan public URL-nya.
 * Path file dikelompokkan per docsId supaya rapi: step-images/{docsId}/{filename}
 */
export async function uploadStepImage(
  file: File,
  docsId: string
): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `${docsId}/${fileName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Hapus file gambar dari storage berdasarkan public URL-nya.
 * Berguna saat gambar step diganti atau step dihapus.
 */
export async function deleteStepImage(publicUrl: string | null | undefined) {
  if (!publicUrl) return;
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);
  await supabase.storage.from(BUCKET).remove([path]);
}