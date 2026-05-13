"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const tournamentSchema = z.object({
  name: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
  sport: z.string().min(2, "Veuillez préciser le sport"),
  city: z.string().min(2, "La ville doit comporter au moins 2 caractères"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
  entryFee: z.coerce.number().int().min(0, "Les frais ne peuvent pas être négatifs").default(0),
  currency: z.string().length(3, "Code devise invalide").default("CAD"),
});

async function getOrganizerUser() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role !== "ORGANIZER") redirect("/dashboard");
  return user;
}

export async function createTournament(formData: FormData) {
  const organizer = await getOrganizerUser();

  const raw = {
    name: formData.get("name") as string,
    sport: formData.get("sport") as string,
    city: formData.get("city") as string,
    startDate: formData.get("startDate") as string,
    entryFee: (formData.get("entryFee") as string) || "0",
    currency: (formData.get("currency") as string) || "CAD",
  };

  const result = tournamentSchema.safeParse(raw);
  if (!result.success) {
    const fe = z.flattenError(result.error).fieldErrors;
    const sp = new URLSearchParams();
    for (const [key, msgs] of Object.entries(fe)) {
      if (msgs?.[0]) sp.set(`e_${key}`, msgs[0]);
    }
    redirect(`/tournaments/new?${sp.toString()}`);
  }

  const { name, sport, city, startDate, entryFee, currency } = result.data;

  const tournament = await prisma.tournament.create({
    data: {
      name,
      sport,
      city,
      startDate: new Date(startDate),
      entryFee,
      currency,
      organizerId: organizer.id,
    },
  });

  revalidatePath("/dashboard");
  redirect(`/tournaments/${tournament.id}?success=1`);
}

export async function deleteTournament(tournamentId: string, _formData: FormData) {
  const organizer = await getOrganizerUser();

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organizerId: organizer.id },
    include: { _count: { select: { teams: true } } },
  });
  if (!tournament) redirect("/dashboard");

  if (tournament._count.teams > 0) {
    redirect(
      `/tournaments/${tournamentId}?e_delete=${encodeURIComponent("Supprimez d'abord toutes les équipes")}`
    );
  }

  await prisma.tournament.delete({ where: { id: tournamentId } });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
