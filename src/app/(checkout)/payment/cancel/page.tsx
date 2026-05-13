export default function PaymentCancelPage() {
  return (
    <div className="py-4 flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full rounded-2xl border border-ink-100 bg-surface shadow-sm p-10 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <span className="text-2xl text-red-500 font-bold">✕</span>
        </div>
        <h1 className="text-xl font-bold text-navy-700">Paiement annulé</h1>
        <p className="text-sm text-ink-500">
          Le paiement a été annulé. Ta demande reste en attente de paiement —
          tu peux la consulter dans tes demandes ou réessayer.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
          <a
            href="/my-requests"
            className="rounded-lg border border-ink-200 bg-surface text-sm font-semibold px-6 py-2.5 text-ink-700 hover:bg-navy-50 hover:text-navy-700 transition-colors"
          >
            Mes demandes
          </a>
          <a
            href="/teams"
            className="rounded-lg bg-navy-700 text-white text-sm font-semibold px-6 py-2.5 hover:bg-navy-800 transition-colors"
          >
            Retour aux équipes
          </a>
        </div>
      </div>
    </div>
  );
}
