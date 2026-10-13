import { panta, errorResponse, PantaError } from "@/lib/panta";

export async function POST(req: Request) {
  try {
    const { orderId, signature, wallet, marketId, quoteId } = await req.json();
    const submitted = await panta("/primaryordersubmit/", { method: "POST", body: { orderId, signature, wallet } });
    let report: unknown = null;
    for (let i = 0; i < 10; i++) {
      try {
        report = await panta("/trades/", { method: "POST", body: { signature, wallet, marketId, quoteId, clientOrderId: orderId } });
        break;
      } catch (e) {
        if (!(e instanceof PantaError) || e.code !== "TX_NOT_FOUND") break;
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    return Response.json({ submitted, report });
  } catch (e) {
    return errorResponse(e);
  }
}
