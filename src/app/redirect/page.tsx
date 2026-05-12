import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncClerkUser } from "@/lib/auth";

export default async function RedirectPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await syncClerkUser();

  if (!user) {
    redirect("/sign-in");
  }

  switch (user.role) {
    case "ORGANIZER":
      redirect("/dashboard");
    case "ADMIN":
      redirect("/admin");
    case "PLAYER":
    default:
      redirect("/profile");
  }
}
