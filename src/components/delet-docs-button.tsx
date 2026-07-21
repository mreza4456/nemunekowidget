"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteDocsAction } from "@/action/docs";

export function DeleteDocsButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Hapus dokumen ini beserta semua step-nya?")) return;
    startTransition(async () => {
      await deleteDocsAction(id);
    });
  }

  return (
    <Button size="icon" variant="ghost" onClick={handleDelete} disabled={isPending} title="Hapus">
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  );
}