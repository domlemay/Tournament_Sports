import { headers } from "next/headers";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

type ClerkUserEvent = {
  type: "user.created" | "user.updated" | "user.deleted";
  data: {
    id: string;
    email_addresses: { email_address: string; id: string }[];
    first_name: string | null;
    last_name: string | null;
    unsafe_metadata?: { role?: string };
    public_metadata?: { role?: string };
  };
};

export async function POST(request: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return new Response("Webhook secret manquant", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("En-têtes svix manquants", { status: 400 });
  }

  const body = await request.text();

  const wh = new Webhook(webhookSecret);
  let event: ClerkUserEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }

  const { type, data } = event;

  if (type === "user.created" || type === "user.updated") {
    const email = data.email_addresses[0]?.email_address ?? "";
    const fullName =
      `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() ||
      email.split("@")[0];

    const rawRole =
      data.unsafe_metadata?.role ?? data.public_metadata?.role ?? "PLAYER";
    const role: Role = ["PLAYER", "ORGANIZER", "ADMIN"].includes(rawRole)
      ? (rawRole as Role)
      : "PLAYER";

    await prisma.user.upsert({
      where: { clerkId: data.id },
      update: { email, fullName, role },
      create: { clerkId: data.id, email, fullName, role },
    });
  }

  if (type === "user.deleted") {
    await prisma.user.deleteMany({ where: { clerkId: data.id } });
  }

  return new Response("OK", { status: 200 });
}
