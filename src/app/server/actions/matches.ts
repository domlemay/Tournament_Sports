"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

async function getOrganizerUser() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role !== "ORGANIZER") redirect("/dashboard");
  return user;
}

const createMatchSchema = z.object({
  teamAId: z.string().min(1, "Équipe A requise"),
  teamBId: z.string().min(1, "Équipe B requise"),
  date: z.string().min(1, "Date requise"),
  location: z.string().min(1, "Lieu requis").max(200, "Lieu trop long"),
});

export async function createMatch(tournamentId: string, formData: FormData) {
  const organizer = await getOrganizerUser();

  const raw = {
    teamAId: formData.get("teamAId") as string,
    teamBId: formData.get("teamBId") as string,
    date: formData.get("date") as string,
    location: (formData.get("location") as string)?.trim(),
  };

  const result = createMatchSchema.safeParse(raw);
  if (!result.success) {
    const fe = z.flattenError(result.error).fieldErrors;
    const p = new URLSearchParams();
    if (fe.teamAId?.[0]) p.set("e_m_teamA", fe.teamAId[0]);
    if (fe.teamBId?.[0]) p.set("e_m_teamB", fe.teamBId[0]);
    if (fe.date?.[0]) p.set("e_m_date", fe.date[0]);
    if (fe.location?.[0]) p.set("e_m_location", fe.location[0]);
    redirect(`/tournaments/${tournamentId}?${p.toString()}`);
  }

  const { teamAId, teamBId, date, location } = result.data;

  if (teamAId === teamBId) {
    redirect(
      `/tournaments/${tournamentId}?e_m_teamB=${encodeURIComponent(
        "Les deux équipes doivent être différentes"
      )}`
    );
  }

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organizerId: organizer.id },
    include: { teams: { select: { id: true } } },
  });
  if (!tournament) redirect("/dashboard");

  const teamIds = tournament.teams.map((t) => t.id);
  if (!teamIds.includes(teamAId) || !teamIds.includes(teamBId)) {
    redirect(
      `/tournaments/${tournamentId}?e_m_teamA=${encodeURIComponent(
        "Équipes invalides pour ce tournoi"
      )}`
    );
  }

  await prisma.match.create({
    data: { teamAId, teamBId, date: new Date(date), location },
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  redirect(`/tournaments/${tournamentId}?success=match`);
}

export async function updateMatch(
  matchId: string,
  tournamentId: string,
  formData: FormData
) {
  const organizer = await getOrganizerUser();

  const date = (formData.get("date") as string)?.trim();
  const location = (formData.get("location") as string)?.trim();
  const scoreAStr = (formData.get("scoreA") as string)?.trim();
  const scoreBStr = (formData.get("scoreB") as string)?.trim();

  if (!date || !location) {
    const p = new URLSearchParams({ editMatch: matchId });
    if (!date) p.set("e_um_date", "Date requise");
    if (!location) p.set("e_um_location", "Lieu requis");
    redirect(`/tournaments/${tournamentId}?${p.toString()}`);
  }

  const scoreA =
    scoreAStr !== "" && scoreAStr !== undefined
      ? Math.max(0, parseInt(scoreAStr, 10) || 0)
      : null;
  const scoreB =
    scoreBStr !== "" && scoreBStr !== undefined
      ? Math.max(0, parseInt(scoreBStr, 10) || 0)
      : null;

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      teamA: { tournament: { id: tournamentId, organizerId: organizer.id } },
    },
  });
  if (!match) redirect(`/tournaments/${tournamentId}`);

  await prisma.match.update({
    where: { id: matchId },
    data: {
      date: new Date(date),
      location,
      scoreA: scoreA !== null && scoreB !== null ? scoreA : null,
      scoreB: scoreA !== null && scoreB !== null ? scoreB : null,
    },
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  redirect(`/tournaments/${tournamentId}?success=match`);
}

export async function deleteMatch(
  matchId: string,
  tournamentId: string,
  _formData: FormData
) {
  const organizer = await getOrganizerUser();

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      teamA: { tournament: { id: tournamentId, organizerId: organizer.id } },
    },
  });
  if (!match) redirect(`/tournaments/${tournamentId}`);

  await prisma.match.delete({ where: { id: matchId } });
  revalidatePath(`/tournaments/${tournamentId}`);
  redirect(`/tournaments/${tournamentId}?success=match`);
}
