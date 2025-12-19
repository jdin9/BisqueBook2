"use client"

import {
  RedirectToSignIn,
  SignedIn,
  SignedOut,
  UserProfile,
} from "@clerk/nextjs"

import { AccountAccessSection } from "@/components/account/account-access-section"

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
        >
          <UserProfile.Page label="Account access" url="account-access">
            <div className="py-4">
              <AccountAccessSection />
            </div>
          </UserProfile.Page>
        </UserProfile>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </div>
  )
}
