import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Public GET endpoint called by Stripe's success_url redirect.
// No auth required — we verify the payment directly with Stripe.
// Uses findFirst + update instead of updateMany because NeonHTTP
// does not support implicit transactions.
export async function GET(req: NextRequest) {
  const session_id = req.nextUrl.searchParams.get("session_id");

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status === "paid") {
        const record = await prisma.joinRequest.findFirst({
          where: { stripeSessionId: session_id },
          select: { id: true, paymentStatus: true },
        });
        if (record && record.paymentStatus !== "PAID") {
          await prisma.joinRequest.update({
            where: { id: record.id },
            data: { paymentStatus: "PAID", paidAt: new Date() },
          });
        }
      }
    } catch (err) {
      console.error("[payment/confirm] error:", err);
    }
  }

  return NextResponse.redirect(new URL("/payment/success", req.url));
}
