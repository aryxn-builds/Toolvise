import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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

  // Refresh the session — IMPORTANT: use getUser(), not getSession()
  // This validates the JWT locally (no DB round-trip) and is safe to call in middleware.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protected routes — redirect to /login if not authenticated
  const protectedPaths = [
    "/advisor",
    "/result",
    "/dashboard",
    "/profile",
    "/settings",
    "/admin",
    "/portfolio",
  ];

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // NOTE: The is_admin check for /admin routes is intentionally NOT done here.
  // Making a database query inside middleware causes MIDDLEWARE_INVOCATION_TIMEOUT
  // on Vercel (504 Gateway Timeout). The admin page itself handles the is_admin
  // guard on the client side.

  // Redirect logged-in users away from /login and /signup only
  // (not from forgot-password, reset-password, auth/callback)
  const authOnlyPaths = ["/login", "/signup"];
  if (user && authOnlyPaths.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
