import { getAllDocs, getDocsWithSteps } from "@/lib/docs/query"; // ⬅️ adjust this import path to wherever your getAllDocs/getDocsWithSteps functions actually live
import type { DocsWithSteps } from "@/lib/docs/query"; // ⬅️ same here
import ToolsHubClient from "@/components/tools-hub";

export const revalidate = 0; // always fetch fresh data; remove/adjust if you want caching

export default async function ToolsHubPage() {
  const docs = await getAllDocs();

  // Fetch steps for every doc in parallel so the client already has everything it needs
  const docsWithSteps = (
    await Promise.all(docs.map((doc) => getDocsWithSteps(doc.id)))
  ).filter((doc): doc is DocsWithSteps => doc !== null);

  return <ToolsHubClient docs={docsWithSteps} />;
}