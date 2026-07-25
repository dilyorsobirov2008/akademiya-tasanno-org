import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token.role;
    const status = (token.status ?? "pending").toLowerCase();

    // Admins have full access
    if (role === "admin") {
      if (pathname === "/pending-approval") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    // Employees cannot access admin routes
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Access control based on user approval status
    if (status === "pending" || status === "rejected") {
      if (pathname !== "/pending-approval") {
        return NextResponse.redirect(new URL("/pending-approval", req.url));
      }
    } else if (status === "approved") {
      if (pathname === "/pending-approval") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/pending-approval"],
};
