import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export async function getCurrentUser() {
    const { userId } = await auth();
    if (!userId) return null;

    return prisma.user.findUnique({
        where: { clerkId: userId },
    });
}

export async function requireUser() {
    const user = await getCurrentUser();
    if (!user) throw new Error("Non authentifié");
    return user;
}

export async function syncClerkUser() {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const fullName =
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
        email.split("@")[0];

    const rawRole = (clerkUser.unsafeMetadata as { role?: string })?.role ?? "PLAYER";
    const validRoles: Role[] = ["PLAYER", "ORGANIZER", "ADMIN"];
    const role: Role = validRoles.includes(rawRole as Role) ? (rawRole as Role) : "PLAYER";

    return prisma.user.upsert({
        where: { clerkId: clerkUser.id },
        update: { email, fullName, role },
        create: { clerkId: clerkUser.id, email, fullName, role },
    });
}
