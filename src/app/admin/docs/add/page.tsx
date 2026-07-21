import { DocsForm } from "@/components/docs-form";

export default function NewDocsPage() {
  return (
    <div className="mx-auto max-w-7xl w-full py-20">
      <h1 className="mb-6 text-2xl font-semibold">Tambah Docs</h1>
      <DocsForm mode="create" />
    </div>
  );
}