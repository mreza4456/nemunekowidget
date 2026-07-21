import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Docs } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Pencil, Plus } from "lucide-react";
import { DeleteDocsButton } from "@/components/delet-docs-button";

export const dynamic = "force-dynamic";
import { getAllDocs } from "@/lib/docs/query";

export default async function DocsPage() {
  const docs = await getAllDocs();


    return (
        <div className="mx-auto max-w-7xl w-full p-5 py-20">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Docs</h1>
                    <p className="text-sm text-muted-foreground">
                        Kelola daftar tutorial/dokumentasi beserta step-stepnya
                    </p>
                </div>
                    <Link href="/admin/docs/add">
                <Button className="flex">
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Docs
                </Button>
                    </Link>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                          
                            <TableHead>Nama</TableHead>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead>App URL</TableHead>
                              <TableHead>Youtube URL</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {docs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    Belum ada docs. Klik &quot;Tambah Docs&quot; untuk membuat yang pertama.
                                </TableCell>
                            </TableRow>
                        )}
                        {docs.map((doc) => (
                            
                                <TableRow key={doc.id}>
                 
                                    <TableCell className="font-medium">{doc.docs_name}</TableCell>
                                    <TableCell className="max-w-[220px] truncate text-muted-foreground">
                                        {doc.description || "—"}
                                    </TableCell>
                                    <TableCell className="max-w-[160px] truncate">
                                        {doc.link_youtube ? (
                                            <a
                                                href={doc.link_youtube}
                                                target="_blank"
                                                className="text-blue-600 hover:underline"
                                            >
                                                {doc.link_youtube}
                                            </a>
                                        ) : (
                                            "—"
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-[160px] truncate">
                                        {doc.link_app ? (
                                            <a
                                                href={doc.link_app}
                                                target="_blank"
                                                className="text-blue-600 hover:underline"
                                            >
                                                {doc.link_app}
                                            </a>
                                        ) : (
                                            "—"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                doc.status === "published"
                                                    ? "default"
                                                    : doc.status === "archived"
                                                        ? "secondary"
                                                        : "outline"
                                            }
                                        >
                                            {doc.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="icon" variant="ghost" title="Edit docs & steps">
                                                <Link href={`/admin/docs/${doc.id}/edit`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <DeleteDocsButton id={doc.id} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}