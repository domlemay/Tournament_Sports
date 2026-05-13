"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

async function getPlayerUser() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");
  return user;
}

async function getOrganizerUser() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role !== "ORGANIZER") redirect("/dashboard");
  return user;
}

export async function createJoinRequest(teamId: string, formData: FormData) {
  const user = await getPlayerUser();
  const message = (formData.get("message") as string)?.trim() || null;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      tournament: { select: { entryFee: true, currency: true, name: true } },
      _count: { select: { members: true } },
    },
  });
  if (!team) redirect("/teams");

  if (team._count.members >= team.maxCapacity) {
    redirect(`/teams/${teamId}?e_join=${encodeURIComponent("Cette équipe est complète")}`);
  }

  const existing = await prisma.joinRequest.findUnique({
    where: { playerId_teamId: { playerId: user.id, teamId } },
  });
  if (existing) redirect(`/teams/${teamId}`);

  if (team.tournament.entryFee === 0) {
    await prisma.joinRequest.create({
      data: { playerId: user.id, teamId, message, paymentStatus: "NOT_REQUIRED" },
    });
    revalidatePath(`/teams/${teamId}`);
    redirect(`/teams/${teamId}?success=join`);
  } else {
    const joinRequest = await prisma.joinRequest.create({
      data: { playerId: user.id, teamId, message, paymentStatus: "PENDING" },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: team.tournament.currency.toLowerCase(),
            unit_amount: team.tournament.entryFee * 100,
            product_data: {
              name: `Inscription — ${team.name}`,
              description: team.tournament.name,
            },
          },
        },
      ],
      metadata: { joinRequestId: joinRequest.id },
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment/cancel`,
    });

    if (!session.url) {
      await prisma.joinRequest.delete({ where: { id: joinRequest.id } });
      redirect(`/teams/${teamId}?e_join=${encodeURIComponent("Erreur lors de la création du paiement")}`);
    }

    await prisma.joinRequest.update({
      where: { id: joinRequest.id },
      data: { stripeSessionId: session.id },
    });

    redirect(session.url);
  }
}

export async function cancelJoinRequest(requestId: string, _formData: FormData) {
  const user = await getPlayerUser();

  const req = await prisma.joinRequest.findUnique({ where: { id: requestId } });
  if (!req || req.playerId !== user.id) redirect("/my-requests");
  if (req.status !== "PENDING" || req.paymentStatus === "PAID") redirect("/my-requests");

  await prisma.joinRequest.delete({ where: { id: requestId } });
  revalidatePath("/my-requests");
  redirect("/my-requests");
}

export async function acceptJoinRequest(requestId: string, _formData: FormData) {
  const organizer = await getOrganizerUser();

  const req = await prisma.joinRequest.findUnique({
    where: { id: requestId },
    include: {
      team: {
        include: {
          tournament: { select: { organizerId: true } },
          _count: { select: { members: true } },
        },
      },
    },
  });

  if (!req || req.team.tournament.organizerId !== organizer.id) redirect("/requests");
  if (req.status !== "PENDING") redirect("/requests");
  if (req.team._count.members >= req.team.maxCapacity) {
    redirect(`/requests?e=${encodeURIComponent("L'équipe est complète")}`);
  }

  await prisma.$transaction([
    prisma.team.update({
      where: { id: req.teamId },
      data: { members: { connect: { id: req.playerId } } },
    }),
    prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
    }),
  ]);

  revalidatePath("/requests");
  redirect("/requests");
}

export async function rejectJoinRequest(requestId: string, _formData: FormData) {
  const organizer = await getOrganizerUser();

  const req = await prisma.joinRequest.findUnique({
    where: { id: requestId },
    include: {
      team: { include: { tournament: { select: { organizerId: true } } } },
    },
  });

  if (!req || req.team.tournament.organizerId !== organizer.id) redirect("/requests");

  await prisma.joinRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED" },
  });

  revalidatePath("/requests");
  redirect("/requests");
}
