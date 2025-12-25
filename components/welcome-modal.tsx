"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

const STORAGE_KEY = "welcomeModalDismissed";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const dismissed = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!dismissed) {
      // Opening the modal in response to reading persisted dismissal state
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch (error) {
      console.error("Unable to persist welcome modal dismissal", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm sm:px-6">
      <div className="absolute inset-0" aria-hidden="true" onClick={handleClose} />
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
        className="relative z-10 w-full max-w-xl border-primary/20 bg-white/95 shadow-2xl backdrop-blur"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          aria-label="Close welcome message"
          className="absolute right-2.5 top-2.5 h-9 w-9 text-muted-foreground hover:bg-primary/10"
        >
          <X className="h-5 w-5" />
        </Button>
        <CardHeader className="space-y-2 pr-12">
          <CardTitle id="welcome-modal-title" className="text-xl sm:text-2xl">
            WELCOME!
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Welcome to our new Pottery Tracker! Gone are the days of a notebook and memory for glaze combos, now we&apos;ll
            be using this app to track photos, glazes, clays, everything you can imagine so we can replicate cool combos
            and admire our gallery of work. This is still in progress, so don&apos;t try anything too fancy yet....
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <Button className="w-full sm:w-auto" onClick={handleClose}>
            Got it
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
