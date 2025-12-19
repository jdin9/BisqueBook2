import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const hasClerkConfig = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);
let warnedAboutClerkConfig = false;

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

const proxy = hasClerkConfig
  ? clerkMiddleware((auth, req) => {
      if (isProtectedRoute(req)) {
        auth.protect();
      }
    })
  : () => {
      if (!warnedAboutClerkConfig) {
        console.warn(
          "Clerk proxy disabled: set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in .env.local to enable route protection.",
        );
        warnedAboutClerkConfig = true;
      }
      return NextResponse.next();
    };

export default proxy;

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/(api|trpc)(.*)"],
};
