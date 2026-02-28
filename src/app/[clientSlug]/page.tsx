import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { DispatchApp } from "@/components/DispatchApp";

const RESERVED_SLUGS = ["dispatch", "admin", "api"];

export default async function ClientPage({ params }: { params: { clientSlug: string } }) {
  const { clientSlug } = params;

  if (RESERVED_SLUGS.includes(clientSlug)) {
    notFound();
  }

  const client = await prisma.dispatchClient.findUnique({
    where: { slug: clientSlug },
  });

  if (!client || !client.isActive) {
    notFound();
  }

  return (
    <DispatchApp
      clientSlug={client.slug}
      clientName={client.headerTitle || client.name}
    />
  );
}
