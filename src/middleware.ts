import { clerkMiddleware } from "@clerk/nextjs/server";

// Route protection is handled in each layout/page via auth().
// Using clerkMiddleware() without auth.protect() here so that
// Clerk's token-refresh handshake can complete before any redirect.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/(api|trpc)(.*)",
  ],
};
