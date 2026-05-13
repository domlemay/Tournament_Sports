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

export async function requireRole(role: Role) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Non authentifié");
    if (user.role !== role) throw new Error(`Rôle ${role} requis`);
    return user;
}

export async function syncClerkUser() {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const fullName =
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
        email.split("@")[0];

    const metadataRole = (clerkUser.unsafeMetadata as { role?: string })?.role;
    const elevatedRoles: Role[] = ["ORGANIZER", "ADMIN"];
    const validRoles: Role[] = ["PLAYER", ...elevatedRoles];
    const role: Role =
        metadataRole && validRoles.includes(metadataRole as Role)
            ? (metadataRole as Role)
            : "PLAYER";

    // Only push role from Clerk metadata when it's an elevated role.
    // "PLAYER" in metadata must NOT overwrite a role that was promoted
    // in-app (e.g. via "Devenir organisateur").
    const syncRole = elevatedRoles.includes(metadataRole as Role);

    return prisma.user.upsert({
        where: { clerkId: clerkUser.id },
        update: { email, fullName, ...(syncRole ? { role } : {}) },
        create: { clerkId: clerkUser.id, email, fullName, role },
    });
}
