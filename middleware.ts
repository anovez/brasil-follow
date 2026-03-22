import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role as string | undefined
  const userStatus = req.auth?.user?.status as string | undefined
  const isAdmin = userRole === "ADMIN"

  // Public routes - allow access without authentication
  const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password"]
  const isPublicRoute =
    publicRoutes.some((route) => pathname === route) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/v2")

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Static assets and public files - allow access
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  // Cron routes - require Bearer token, not user session
  if (pathname.startsWith("/api/cron")) {
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Not logged in - redirect to login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Banned user - force logout
  if (userStatus === "BANNED") {
    return NextResponse.redirect(new URL("/login?error=banned", req.url))
  }

  // Admin routes - require ADMIN role
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
}
