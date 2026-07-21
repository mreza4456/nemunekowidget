import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/server";

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname.startsWith("/auth/login");

  // 1) Belum login tapi mau akses /admin -> redirect ke /login
  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  // 2) Sudah login tapi masih buka /login -> lempar ke /admin
  if (isLoginRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = ""; // penting: hapus query lama (mis. ?redirectedFrom=...)
    return NextResponse.redirect(url);
  }

 
  return response;
}

export const config = {
  matcher: [
    /*
     * Jalankan middleware di semua route KECUALI:
     * - file statis (_next/static, _next/image)
     * - favicon
     * - asset gambar
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

