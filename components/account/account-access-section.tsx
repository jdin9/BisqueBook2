"use client"

import { useEffect, useMemo, useState } from "react"
import { useUser } from "@clerk/nextjs"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function AccountAccessSection() {
  const { user, isLoaded } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unsafeMetadata = useMemo<Record<string, unknown>>(() => {
    if (!user) return {}

    const data = user.unsafeMetadata || {}
    return typeof data === "object" && data !== null ? data : {}
  }, [user])

  const publicMetadata = useMemo<Record<string, unknown>>(() => {
    if (!user) return {}

    const data = user.publicMetadata || {}
    return typeof data === "object" && data !== null ? data : {}
  }, [user])

  useEffect(() => {
    if (isLoaded && user) {
      const adminFlag =
        unsafeMetadata.isAdmin ?? publicMetadata.isAdmin

      setIsAdmin(adminFlag === true)
    }
  }, [isLoaded, user, unsafeMetadata, publicMetadata])

  const handleToggle = async () => {
    if (!user) return

    const nextValue = !isAdmin

    setSaving(true)
      setError(null)

    try {
      await user.update({
        unsafeMetadata: {
          ...unsafeMetadata,
          isAdmin: nextValue,
        },
        // @ts-expect-error Clerk's type helper omits publicMetadata even though the API supports it.
        publicMetadata: {
          ...publicMetadata,
          isAdmin: nextValue,
        },
      })
      setIsAdmin(nextValue)
    } catch (err) {
      console.error(err)
      setError("We couldn't update admin status. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border/80 bg-gradient-to-br from-background to-muted/20">
      <CardHeader>
        <CardTitle>Account access</CardTitle>
        <CardDescription>
          Turn admin status on or off for this profile. Admins can manage studios,
          members, and other protected areas of the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-medium">Admin status</p>
            <p className="text-sm text-muted-foreground">
              Check this box to grant admin permissions. You can uncheck it at any time.
            </p>
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="size-5 rounded border-muted-foreground/40 text-primary accent-primary"
              checked={isAdmin}
              onChange={handleToggle}
              disabled={!isLoaded || saving}
              aria-label="Toggle admin status"
            />
            <span className="text-sm text-muted-foreground">
              {isAdmin ? "Enabled" : "Disabled"}
            </span>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleToggle} disabled={!isLoaded || saving || !user}>
            {saving ? "Saving..." : isAdmin ? "Remove admin access" : "Grant admin access"}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
