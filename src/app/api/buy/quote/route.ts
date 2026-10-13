import { panta, errorResponse } from "@/lib/panta";

export async function POST(req: Request) {
  try {
    const { wallet, marketId, side, amountUsdc } = await req.json();
    return Response.json(await panta("/primaryorderquote/", { method: "POST", body: { wallet, marketId, side, amountUsdc: String(amountUsdc) } }));
  } catch (e) {
    return errorResponse(e);
  }
}
