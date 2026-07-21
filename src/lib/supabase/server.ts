// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from "next/server";
export const createClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}



/**
 * Ini bagian "proxy"-nya: dijalankan di setiap request (lewat middleware.ts),
 * memastikan token Supabase selalu fresh, lalu mengembalikan
 * { supabase, response, user } supaya middleware.ts bisa memutuskan
 * apakah request boleh diteruskan ke /admin atau di-redirect ke /login.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // PENTING: jangan hapus baris ini. getUser() akan memvalidasi token
  // ke server Supabase (bukan cuma baca cookie), jadi ini yang membuat
  // proses auth-nya aman dari token yang sudah expired/dipalsukan.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, response: supabaseResponse, user };
}