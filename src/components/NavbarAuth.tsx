"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";

export default function NavbarAuth() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return (
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
          },
        }}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/sign-in"
        className="rounded-lg px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50 transition-colors"
      >
        Se connecter
      </Link>
      <Link
        href="/sign-up"
        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
      >
        S&apos;inscrire
      </Link>
    </div>
  );
}
