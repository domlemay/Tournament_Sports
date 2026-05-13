"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function AuthedRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const raw = searchParams.get("redirect_url");
      // Only allow relative paths to prevent open-redirect attacks
      const destination = raw?.startsWith("/") ? raw : "/redirect";
      router.replace(destination);
    }
  }, [isLoaded, isSignedIn, router, searchParams]);

  return null;
}
