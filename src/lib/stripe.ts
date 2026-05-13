import Stripe from "stripe";

type G = typeof globalThis & { _stripe?: Stripe };

function build(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

function instance(): Stripe {
  const g = globalThis as G;
  if (!g._stripe) g._stripe = build();
  return g._stripe;
}

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return Reflect.get(instance(), prop);
  },
});
