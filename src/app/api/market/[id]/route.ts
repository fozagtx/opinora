import { getMarket, getTrades, errorResponse } from "@/lib/panta";

export async function GET(_req: Request, ctx: RouteContext<"/api/market/[id]">) {
  try {
    const { id } = await ctx.params;
    const [market, trades] = await Promise.all([getMarket(id), getTrades(id).catch(() => [])]);
    return Response.json({ market, trades });
  } catch (e) {
    return errorResponse(e);
  }
}
