import { panta, errorResponse } from "@/lib/panta";

export async function POST(req: Request) {
  try {
    const { quoteId, wallet } = await req.json();
    return Response.json(await panta("/primaryorderbuild/", { method: "POST", body: { quoteId, wallet, maxSlippageBps: 300 } }));
  } catch (e) {
    return errorResponse(e);
  }
}
