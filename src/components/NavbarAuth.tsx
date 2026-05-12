"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";

export default function NavbarAuth() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <UserButton />;
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/sign-in"
        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        Se connecter
      </Link>
      <Link
        href="/sign-up"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        S&apos;inscrire
      </Link>
    </div>
  );
}
