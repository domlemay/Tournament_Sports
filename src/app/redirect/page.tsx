import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function RedirectPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

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
