import { notFound } from "next/navigation";
import { getDocsWithSteps } from "@/lib/docs/query";
import { DocsForm } from "@/components/docs-form";

export default async function EditDocsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getDocsWithSteps(id);

  if (!result) notFound();

  const { steps, ...docs } = result;

  return (
    <div className="mx-auto max-w-7xl w-full py-20">
      <h1 className="mb-6 text-2xl font-semibold">Edit Docs</h1>
      <DocsForm mode="edit" docsToEdit={docs} stepsToEdit={steps} />
    </div>
  );
}