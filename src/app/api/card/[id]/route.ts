import { getMarket, errorResponse } from "@/lib/panta";
import { marketCard } from "@/lib/card";

export async function GET(req: Request, ctx: RouteContext<"/api/card/[id]">) {
  try {
    const { id } = await ctx.params;
    const market = await getMarket(id);
    const story = new URL(req.url).searchParams.get("format") === "story";
    const download = new URL(req.url).searchParams.has("download");
    return marketCard(market, story ? { width: 1080, height: 1350 } : { width: 1200, height: 630 }, {
      "Cache-Control": "public, max-age=60",
      ...(download ? { "Content-Disposition": `attachment; filename="opinora-${id.slice(0, 8)}.png"` } : {}),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
