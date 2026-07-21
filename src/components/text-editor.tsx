
"use client"

import React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    Undo,
    Redo,
    LinkIcon,
    Heading2,
    
} from "lucide-react"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
    value?: string
    onChange: (html: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = "Tulis deskripsi...",
    className,
    disabled,
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
            }),
            Placeholder.configure({ placeholder }),
            Link.configure({ openOnClick: false, autolink: true }),
        ],
        content: value,
        editable: !disabled,
        immediatelyRender: false, // penting untuk Next.js SSR, hindari hydration mismatch
        editorProps: {
            attributes: {
                class:
                    "prose prose-sm max-w-none min-h-[120px] px-3 py-2 focus:outline-none",
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
    })

    // sinkronkan value eksternal (misal saat reset form / load data awal)
    React.useEffect(() => {
        if (!editor) return
        const current = editor.getHTML()
        if (value !== undefined && value !== current) {
            editor.commands.setContent(value, { emitUpdate: false })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, editor])

    if (!editor) return null

    const ToolbarButton = ({
        onClick,
        active,
        disabled: btnDisabled,
        children,
        title,
    }: {
        onClick: () => void
        active?: boolean
        disabled?: boolean
        children: React.ReactNode
        title: string
    }) => (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            title={title}
            disabled={btnDisabled}
            onClick={onClick}
            className={cn("h-8 w-8", active && "bg-slate-200")}
        >
            {children}
        </Button>
    )

    const setLink = () => {
        const previousUrl = editor.getAttributes("link").href
        const url = window.prompt("Masukkan URL", previousUrl || "https://")
        if (url === null) return
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run()
            return
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    }

    return (
        <div className={cn("border rounded-md bg-white", className)}>
            <div className="flex flex-wrap items-center gap-1 border-b p-1">
                <ToolbarButton
                    title="Bold"
                    active={editor.isActive("bold")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    title="Italic"
                    active={editor.isActive("italic")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    title="Strikethrough"
                    active={editor.isActive("strike")}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                    <Strikethrough className="h-4 w-4" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <ToolbarButton
                    title="Heading"
                    active={editor.isActive("heading", { level: 2 })}
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                >
                    <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    title="Bullet List"
                    active={editor.isActive("bulletList")}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    title="Numbered List"
                    active={editor.isActive("orderedList")}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    title="Link"
                    active={editor.isActive("link")}
                    onClick={setLink}
                >
                    <LinkIcon className="h-4 w-4" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <ToolbarButton
                    title="Undo"
                    disabled={!editor.can().undo()}
                    onClick={() => editor.chain().focus().undo().run()}
                >
                    <Undo className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    title="Redo"
                    disabled={!editor.can().redo()}
                    onClick={() => editor.chain().focus().redo().run()}
                >
                    <Redo className="h-4 w-4" />
                </ToolbarButton>
            </div>

            <EditorContent editor={editor} />
        </div>
    )
}