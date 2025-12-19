"use client"

import { RedirectToSignIn, SignedIn, SignedOut, UserProfile } from "@clerk/nextjs"

export default function AccountPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <SignedIn>
        <UserProfile
          appearance={{
            elements: {
              rootBox: "w-full", // allow full width so custom page aligns with Clerk layout
              card: "shadow-sm border border-border/80",
              navbar: "lg:w-64",
            },
          }}
        />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </div>
  )
}
