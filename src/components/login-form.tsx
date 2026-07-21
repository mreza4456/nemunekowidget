"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi.")
    .email("Format email tidak valid."),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter."),
})

export function LoginForm() {
  const router = useRouter()


  const [loading, setLoading] = React.useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    setLoading(false)

    if (error) {
      toast.error("Gagal login", {
        description: error.message,
        position: "bottom-right",
      })
      return
    }

    toast.success("Login berhasil", {
      description: "Mengarahkan ke dashboard...",
      position: "bottom-right",
    })

    router.refresh()
    router.push("/admin/docs")
  }

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Masukkan email dan password untuk masuk ke akun kamu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-login" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-login-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="form-login-email"
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder="nama@contoh.com"
                    autoComplete="email"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-login-password">
                    Password
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-login-password"
                    type="password"
                    aria-invalid={fieldState.invalid}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <FieldDescription>
                    Minimal 6 karakter.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          
          <Button type="submit" form="form-login" className="w-full" disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}