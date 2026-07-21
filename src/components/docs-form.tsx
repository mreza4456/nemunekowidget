"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Docs, DocsStatus, Step } from "@/types";
import { createDocsAction, updateDocsAction } from "@/action/docs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ImagePlus, X } from "lucide-react";

interface StepFormItem {
  key: string;
  id?: string;
  title: string;
  description: string;
  step_order: number;
  image: string | null;
  imageFile: File | null;
  previewUrl: string | null;
}

const emptyDocsForm = {
  docs_name: "",
  description: "",
  link_app: "",
  link_youtube: "",
  status: "draft" as DocsStatus,
};

function newStep(order: number): StepFormItem {
  return {
    key: crypto.randomUUID(),
    title: "",
    description: "",
    step_order: order,
    image: null,
    imageFile: null,
    previewUrl: null,
  };
}

interface DocsFormProps {
  mode: "create" | "edit";
  docsToEdit?: Docs;
  stepsToEdit?: Step[];
}

export function DocsForm({ mode, docsToEdit, stepsToEdit }: DocsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [docsForm, setDocsForm] = useState(emptyDocsForm);
  const [steps, setSteps] = useState<StepFormItem[]>([newStep(1)]);
  const [removedStepIds, setRemovedStepIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!docsToEdit) return;
    setDocsForm({
      docs_name: docsToEdit.docs_name,
      description: docsToEdit.description ?? "",
      link_app: docsToEdit.link_app ?? "",
      link_youtube: docsToEdit.link_youtube ?? "",
      status: docsToEdit.status,
    });
    setSteps(
      stepsToEdit && stepsToEdit.length > 0
        ? stepsToEdit.map((s) => ({
            key: crypto.randomUUID(),
            id: s.id,
            title: s.title,
            description: s.description ?? "",
            step_order: s.step_order,
            image: s.image,
            imageFile: null,
            previewUrl: null,
          }))
        : [newStep(1)]
    );
  }, [docsToEdit, stepsToEdit]);

  function updateStep(key: string, patch: Partial<StepFormItem>) {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  function handleAddStep() {
    setSteps((prev) => [...prev, newStep(prev.length + 1)]);
  }

  function handleRemoveStep(key: string) {
    setSteps((prev) => {
      const target = prev.find((s) => s.key === key);
      if (target?.id) setRemovedStepIds((ids) => [...ids, target.id!]);
      const next = prev.filter((s) => s.key !== key);
      return next.length > 0 ? next : [newStep(1)];
    });
  }

  function handleImageSelect(key: string, file: File | null) {
    if (!file) {
      updateStep(key, { imageFile: null, previewUrl: null });
      return;
    }
    updateStep(key, { imageFile: file, previewUrl: URL.createObjectURL(file) });
  }

  function handleSubmit() {
    setErrorMsg(null);

    if (!docsForm.docs_name.trim()) {
      setErrorMsg("Nama docs wajib diisi.");
      return;
    }
    if (steps.some((s) => !s.title.trim())) {
      setErrorMsg("Judul setiap step wajib diisi.");
      return;
    }

    const fd = new FormData();
    fd.set("docs_name", docsForm.docs_name);
    fd.set("description", docsForm.description);
    fd.set("link_app", docsForm.link_app);
    fd.set("link_youtube", docsForm.link_youtube);
    fd.set("status", docsForm.status);

    const stepsMeta = steps.map((s) => ({
      key: s.key,
      id: s.id,
      title: s.title,
      description: s.description,
      step_order: s.step_order,
      existingImage: s.image,
    }));
    fd.set("steps", JSON.stringify(stepsMeta));
    fd.set("removedStepIds", JSON.stringify(removedStepIds));

    for (const s of steps) {
      if (s.imageFile) fd.set(`image_${s.key}`, s.imageFile);
    }

    startTransition(async () => {
      try {
        if (mode === "edit" && docsToEdit) {
          await updateDocsAction(docsToEdit.id, fd);
        } else {
          await createDocsAction(fd);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Gagal menyimpan data. Coba lagi.");
      }
    });
  }

  return (
    <div className="flex flex-col w-full gap-6">
      {errorMsg && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{errorMsg}</p>
      )}

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="docs_name">Nama Docs</Label>
          <Input
            id="docs_name"
            value={docsForm.docs_name}
            onChange={(e) => setDocsForm({ ...docsForm, docs_name: e.target.value })}
            placeholder="Contoh: Cara Setup Widget"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea
            id="description"
            value={docsForm.description}
            onChange={(e) => setDocsForm({ ...docsForm, description: e.target.value })}
            placeholder="Ringkasan singkat tutorial ini"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="link">App Url</Label>
          <Input
            id="link_app"
            value={docsForm.link_app}
            onChange={(e) => setDocsForm({ ...docsForm, link_app: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="youtube">Youtube Url</Label>
            <Input
              id="link_youtube"
              value={docsForm.link_youtube}
              onChange={(e) => setDocsForm({ ...docsForm, link_youtube: e.target.value })}
              placeholder="https://youtube.com/..."
            />
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={docsForm.status}
              onValueChange={(v) => setDocsForm({ ...docsForm, status: v as DocsStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Steps</h3>
          <Button size="sm" variant="outline" onClick={handleAddStep} type="button">
            <Plus className="mr-1 h-4 w-4" />
            Tambah Step
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {steps.map((step, index) => (
            <div key={step.key} className="relative rounded-md border p-4 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Step {index + 1}
                </span>
                {steps.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => handleRemoveStep(step.key)}
                    title="Hapus step ini"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>Judul</Label>
                  <Input
                    value={step.title}
                    onChange={(e) => updateStep(step.key, { title: e.target.value })}
                    placeholder="Contoh: Buka pengaturan widget"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Deskripsi</Label>
                  <Textarea
                    value={step.description}
                    onChange={(e) => updateStep(step.key, { description: e.target.value })}
                    placeholder="Penjelasan langkah ini"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Gambar</Label>
                  <div className="flex items-center gap-3">
                    {(step.previewUrl || step.image) && (
                      <img
                        src={step.previewUrl || step.image!}
                        alt="Preview"
                        className="h-16 w-16 rounded object-cover"
                      />
                    )}
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
                      <ImagePlus className="h-4 w-4" />
                      {step.previewUrl || step.image ? "Ganti gambar" : "Upload gambar"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageSelect(step.key, e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" type="button" onClick={() => router.push("/admin/docs")}>
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={isPending} type="button">
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </div>
  );
}