"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const teamSchema = z.object({
  name: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
  maxCapacity: z.coerce
    .number()
    .int()
    .min(2, "Minimum 2 joueurs")
    .max(50, "Maximum 50 joueurs"),
});

async function getOrganizerUser() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role !== "ORGANIZER") redirect("/dashboard");
  return user;
}

export async function createTeam(tournamentId: string, formData: FormData) {
  const organizer = await getOrganizerUser();

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organizerId: organizer.id },
  });
  if (!tournament) redirect("/dashboard");

  const raw = {
    name: formData.get("name") as string,
    maxCapacity: (formData.get("maxCapacity") as string) || "15",
  };

  const result = teamSchema.safeParse(raw);
  if (!result.success) {
    const fe = z.flattenError(result.error).fieldErrors;
    const sp = new URLSearchParams();
    for (const [key, msgs] of Object.entries(fe)) {
      if (msgs?.[0]) sp.set(`e_${key}`, msgs[0]);
    }
    redirect(`/tournaments/${tournamentId}?${sp.toString()}`);
  }

  await prisma.team.create({
    data: {
      name: result.data.name,
      maxCapacity: result.data.maxCapacity,
      tournamentId,
    },
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  redirect(`/tournaments/${tournamentId}?success=team`);
}

export async function updateTeam(
  teamId: string,
  tournamentId: string,
  formData: FormData
) {
  const organizer = await getOrganizerUser();

  const team = await prisma.team.findFirst({
    where: { id: teamId, tournament: { organizerId: organizer.id } },
  });
  if (!team) redirect("/dashboard");

  const raw = {
    name: formData.get("name") as string,
    maxCapacity: (formData.get("maxCapacity") as string) || "15",
  };

  const result = teamSchema.safeParse(raw);
  if (!result.success) {
    const fe = z.flattenError(result.error).fieldErrors;
    const sp = new URLSearchParams({ edit: teamId });
    for (const [key, msgs] of Object.entries(fe)) {
      if (msgs?.[0]) sp.set(`e_${key}`, msgs[0]);
    }
    redirect(`/tournaments/${tournamentId}?${sp.toString()}`);
  }

  await prisma.team.update({
    where: { id: teamId },
    data: { name: result.data.name, maxCapacity: result.data.maxCapacity },
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  redirect(`/tournaments/${tournamentId}?success=team`);
}

export async function deleteTeam(
  teamId: string,
  tournamentId: string,
  _formData: FormData
) {
  const organizer = await getOrganizerUser();

  const team = await prisma.team.findFirst({
    where: { id: teamId, tournament: { organizerId: organizer.id } },
    include: { _count: { select: { members: true } } },
  });
  if (!team) redirect("/dashboard");

  if (team._count.members > 0) {
    redirect(
      `/tournaments/${tournamentId}?e_delete=${encodeURIComponent("Des joueurs sont inscrits dans cette équipe")}`
    );
  }

  await prisma.team.delete({ where: { id: teamId } });

  revalidatePath(`/tournaments/${tournamentId}`);
  redirect(`/tournaments/${tournamentId}`);
}
