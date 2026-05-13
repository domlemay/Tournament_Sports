import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-10 text-center space-y-4">
        <div className="text-4xl">✓</div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Paiement confirmé
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Votre paiement a été reçu. Votre demande est maintenant en attente
          d&apos;approbation par l&apos;organisateur.
        </p>
        <Link
          href="/my-requests"
          className="inline-block mt-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold px-6 py-2.5 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
        >
          Voir mes demandes
        </Link>
      </div>
    </main>
  );
}
