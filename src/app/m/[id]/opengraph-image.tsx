import { getMarket } from "@/lib/panta";
import { marketCard } from "@/lib/card";

export const alt = "Opinora market";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return marketCard(await getMarket(id), size);
}
