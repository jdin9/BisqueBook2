import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const hasClerkConfig = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);
let warnedAboutClerkConfig = false;

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

const middleware = hasClerkConfig
  ? clerkMiddleware((auth, req) => {
      if (isProtectedRoute(req)) {
        auth.protect();
      }
    })
  : () => {
      if (!warnedAboutClerkConfig) {
        console.warn(
          "Clerk middleware disabled: set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in .env.local to enable route protection.",
        );
        warnedAboutClerkConfig = true;
      }
      return NextResponse.next();
    };

export default middleware;

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/(api|trpc)(.*)"],
};
