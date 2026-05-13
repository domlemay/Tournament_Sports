import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cancelJoinRequest } from "@/app/server/actions/join-requests";

const statusLabel: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
};

const statusClass: Record<string, string> = {
  PENDING: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
  ACCEPTED: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
  REJECTED: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
};

export default async function MyRequestsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const requests = await prisma.joinRequest.findMany({
    where: { playerId: user.id },
    include: {
      team: {
        include: {
          tournament: { select: { name: true, sport: true, city: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Mes demandes
        </h1>

        {requests.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Vous n&apos;avez pas encore fait de demande.{" "}
            <Link
              href="/teams"
              className="underline hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              Chercher une équipe
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const canCancel =
                req.status === "PENDING" && req.paymentStatus !== "PAID";
              return (
                <div
                  key={req.id}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {req.team.name}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {req.team.tournament.sport} · {req.team.tournament.city}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {req.team.tournament.name} ·{" "}
                        {req.createdAt.toLocaleDateString("fr-CA", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      {req.message && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 italic pt-1">
                          &ldquo;{req.message}&rdquo;
                        </p>
                      )}
                      {req.paymentStatus === "PENDING" && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 pt-1">
                          Paiement en attente
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusClass[req.status]}`}
                      >
                        {statusLabel[req.status]}
                      </span>
                      {canCancel && (
                        <form action={cancelJoinRequest.bind(null, req.id)}>
                          <button
                            type="submit"
                            className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 underline cursor-pointer"
                          >
                            Annuler
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
