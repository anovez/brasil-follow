import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password"]
  const isPublicRoute =
    publicRoutes.some((route) => pathname === route) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/v2")

  if (isPublicRoute) return NextResponse.next()

  if (pathname.startsWith("/api/cron")) {
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.next()
  }

  const cookieName = process.env.NEXTAUTH_URL?.startsWith("https")
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token"

  const token = req.cookies.get(cookieName)?.value

  if (!token) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
    const { payload } = await jwtVerify(token, secret)

    if (payload.status === "BANNED") {
      return NextResponse.redirect(new URL("/login?error=banned", req.url))
    }

    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      if (payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url))
      }
    }
  } catch {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
}