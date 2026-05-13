import { SignIn } from "@clerk/nextjs";
import { AuthedRedirect } from "./authed-redirect";

export default function SignInPage() {
  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <AuthedRedirect />
      <SignIn fallbackRedirectUrl="/redirect" />
    </div>
  );
}
